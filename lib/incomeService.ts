import { db } from "./firebase";
import { collection, query, where, getDocs, doc, runTransaction, serverTimestamp, Timestamp } from "firebase/firestore";

/**
 * Syncs daily income for active products for a specific user.
 * This should be called when the user visits the dashboard.
 */
export async function syncUserIncome(userId: string) {
    if (!userId) return;

    try {
        const ordersRef = collection(db, "UserOrders");
        const q = query(ordersRef, where("userId", "==", userId), where("status", "==", "active"));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) return;

        const now = Timestamp.now().toMillis();
        const MS_PER_DAY = 24 * 60 * 60 * 1000;

        for (const orderDoc of querySnapshot.docs) {
            const orderData = orderDoc.data();
            const lastSync = orderData.lastIncomeSync?.toMillis() || orderData.purchaseDate?.toMillis() || now;

            // Calculate how many full days has passed since last sync
            const timePassed = now - lastSync;
            const daysPassed = Math.floor(timePassed / MS_PER_DAY);

            if (daysPassed > 0) {
                await runTransaction(db, async (transaction) => {
                    const userRef = doc(db, "Customers", userId);
                    const userSnap = await transaction.get(userRef);
                    const freshOrderSnap = await transaction.get(orderDoc.ref);

                    if (!userSnap.exists() || !freshOrderSnap.exists()) return;

                    const freshOrderData = freshOrderSnap.data();
                    const availableDays = Math.min(daysPassed, freshOrderData.remainingDays);

                    if (availableDays <= 0) {
                        transaction.update(orderDoc.ref, { status: "completed" });
                        return;
                    }

                    const incomeToEarn = freshOrderData.dailyIncome * availableDays;
                    const newRemainingDays = freshOrderData.remainingDays - availableDays;

                    // Calculate the precise timestamp for the end of the sync period
                    const syncCutoffMillis = lastSync + (availableDays * MS_PER_DAY);
                    const syncCutoff = Timestamp.fromMillis(syncCutoffMillis);

                    // Update user balance
                    transaction.update(userRef, {
                        balanceWallet: (userSnap.data().balanceWallet || 0) + incomeToEarn
                    });

                    // Update order sync state
                    transaction.update(orderDoc.ref, {
                        remainingDays: newRemainingDays,
                        lastIncomeSync: syncCutoff,
                        status: newRemainingDays <= 0 ? "completed" : "active"
                    });
                });
                console.log(`Synced ${daysPassed} days of income for product: ${orderData.productName}`);
            }
        }
    } catch (error) {
        console.error("Error syncing user income:", error);
    }
}
