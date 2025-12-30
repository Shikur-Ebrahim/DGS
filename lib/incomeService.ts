import { db } from "./firebase";
import { collection, query, where, getDocs, doc, runTransaction, serverTimestamp, Timestamp } from "firebase/firestore";

/**
 * Core logic to sync income for a single order document.
 */
async function syncOrderIncome(orderDoc: any, now: number) {
    const orderData = orderDoc.data();
    const userId = orderData.userId;
    const lastSync = orderData.lastIncomeSync?.toMillis() || orderData.purchaseDate?.toMillis() || now;
    const MS_PER_DAY = 24 * 60 * 60 * 1000;

    // Calculate how many midnight-UTC transitions have passed since last sync
    let daysPassed = Math.floor(now / MS_PER_DAY) - Math.floor(lastSync / MS_PER_DAY);
    if (isNaN(daysPassed)) daysPassed = 0;

    if (daysPassed > 0) {
        await runTransaction(db, async (transaction) => {
            const userRef = doc(db, "Customers", userId);
            const userSnap = await transaction.get(userRef);
            const freshOrderSnap = await transaction.get(orderDoc.ref);

            if (!userSnap.exists() || !freshOrderSnap.exists()) return;

            const freshOrderData = freshOrderSnap.data() as any;
            const availableDays = Math.min(daysPassed, freshOrderData.remainingDays || 0);

            if (availableDays <= 0) {
                // If it was active but somehow has 0 or less days, mark completed just in case
                if (freshOrderData.remainingDays <= 0) {
                    transaction.update(orderDoc.ref, { status: "completed" });
                }
                return;
            }

            // Safety: Convert dailyIncome to number and handle NaN/missing cases
            const dailyIncomeNum = Number(freshOrderData.dailyIncome);
            if (isNaN(dailyIncomeNum) || dailyIncomeNum < 0) {
                console.error(`Invalid dailyIncome (${freshOrderData.dailyIncome}) for order ${orderDoc.id}`);
                // Don't update balance with NaN, just mark as completed or error if it's broken
                transaction.update(orderDoc.ref, { status: "error", errorFlag: "NaN_INCOME" });
                return;
            }

            const incomeToEarn = dailyIncomeNum * availableDays;
            const newRemainingDays = (freshOrderData.remainingDays || 0) - availableDays;

            // The new lastSync should be the start of the current day (UTC midnight)
            const syncCutoffMillis = Math.floor(now / MS_PER_DAY) * MS_PER_DAY;
            const syncCutoff = Timestamp.fromMillis(syncCutoffMillis);

            // Update user balance
            const currentBalance = Number(userSnap.data().balanceWallet) || 0;
            transaction.update(userRef, {
                balanceWallet: currentBalance + incomeToEarn
            });

            // Update order sync state
            transaction.update(orderDoc.ref, {
                remainingDays: newRemainingDays,
                lastIncomeSync: syncCutoff,
                status: newRemainingDays <= 0 ? "completed" : "active"
            });
            console.log(`Synced ${daysPassed} days of (ETB ${incomeToEarn}) income for user ${userId}, product: ${orderData.productName}`);
        });
    }
}

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
        for (const orderDoc of querySnapshot.docs) {
            await syncOrderIncome(orderDoc, now);
        }
    } catch (error) {
        console.error("Error syncing user income:", error);
    }
}

/**
 * Syncs daily income for ALL active products for ALL users.
 * This can be triggered by a cron job at 00:00 UTC.
 */
export async function syncAllIncome() {
    try {
        const ordersRef = collection(db, "UserOrders");
        const q = query(ordersRef, where("status", "==", "active"));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) return;

        const now = Timestamp.now().toMillis();
        for (const orderDoc of querySnapshot.docs) {
            await syncOrderIncome(orderDoc, now);
        }
        console.log(`Global income sync completed for ${querySnapshot.size} orders.`);
    } catch (error) {
        console.error("Error syncing all income:", error);
    }
}
