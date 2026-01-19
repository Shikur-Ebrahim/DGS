import { db } from "./firebase";
import { collection, query, where, getDocs, doc, runTransaction, serverTimestamp, Timestamp, updateDoc } from "firebase/firestore";

/**
 * Core logic to sync income for a single order document.
 */
async function syncOrderIncome(orderDoc: any, now: number) {
    const orderData = orderDoc.data();
    const userId = orderData.userId;
    const lastSync = orderData.lastIncomeSync?.toMillis() || orderData.purchaseDate?.toMillis() || now;
    const MS_PER_DAY = 24 * 60 * 60 * 1000;

    // RULE: If current day is Sunday (UTC), do NOT add any daily income.
    const currentUTCDay = new Date(now).getUTCDay();
    if (currentUTCDay === 0) {
        return;
    }

    // Calculate how many midnight-UTC transitions have passed since last sync
    let daysPassed = Math.floor(now / MS_PER_DAY) - Math.floor(lastSync / MS_PER_DAY);
    if (isNaN(daysPassed)) daysPassed = 0;

    if (daysPassed > 0) {
        // Evaluate each day transition to skip Sundays
        let validEarningDays = 0;
        let startDayIndex = Math.floor(lastSync / MS_PER_DAY) + 1;
        let endDayIndex = Math.floor(now / MS_PER_DAY);

        for (let i = startDayIndex; i <= endDayIndex; i++) {
            const transitionTime = i * MS_PER_DAY;
            const transitionDay = new Date(transitionTime).getUTCDay();
            // If transitionDay is 1 (Monday), it means the day that just ended was Sunday.
            // Sunday is a non-earning day, so we skip this transition.
            if (transitionDay !== 1) {
                validEarningDays++;
            }
        }

        if (validEarningDays <= 0) {
            // Even if no income earned, update lastSync to 'now' (midnight) to avoid re-processing these days
            const syncCutoffMillis = Math.floor(now / MS_PER_DAY) * MS_PER_DAY;
            await updateDoc(orderDoc.ref, {
                lastIncomeSync: Timestamp.fromMillis(syncCutoffMillis)
            });
            return;
        }

        await runTransaction(db, async (transaction) => {
            const userRef = doc(db, "Customers", userId);
            const userSnap = await transaction.get(userRef);
            const freshOrderSnap = await transaction.get(orderDoc.ref);

            if (!userSnap.exists() || !freshOrderSnap.exists()) return;

            const freshOrderData = freshOrderSnap.data() as any;
            const availableDays = Math.min(validEarningDays, freshOrderData.remainingDays || 0);

            if (availableDays <= 0) {
                if (freshOrderData.remainingDays <= 0) {
                    transaction.update(orderDoc.ref, { status: "completed" });
                }
                return;
            }

            const dailyIncomeNum = Number(freshOrderData.dailyIncome);
            if (isNaN(dailyIncomeNum) || dailyIncomeNum < 0) {
                console.error(`Invalid dailyIncome (${freshOrderData.dailyIncome}) for order ${orderDoc.id}`);
                transaction.update(orderDoc.ref, { status: "error", errorFlag: "NaN_INCOME" });
                return;
            }

            const incomeToEarn = dailyIncomeNum * availableDays;
            const newRemainingDays = (freshOrderData.remainingDays || 0) - availableDays;

            const syncCutoffMillis = Math.floor(now / MS_PER_DAY) * MS_PER_DAY;
            const syncCutoff = Timestamp.fromMillis(syncCutoffMillis);

            const currentBalance = Number(userSnap.data().balanceWallet) || 0;
            transaction.update(userRef, {
                balanceWallet: currentBalance + incomeToEarn
            });

            transaction.update(orderDoc.ref, {
                remainingDays: newRemainingDays,
                lastIncomeSync: syncCutoff,
                status: newRemainingDays <= 0 ? "completed" : "active"
            });
            console.log(`Synced ${availableDays} earning days (ETB ${incomeToEarn}) for user ${userId}. (Total passed: ${daysPassed}, skipped Sundays)`);
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
        const now = Timestamp.now().toMillis();
        const currentUTCDay = new Date(now).getUTCDay();
        if (currentUTCDay === 0) {
            console.log("Sunday: Skipping user income sync.");
            return;
        }

        const ordersRef = collection(db, "UserOrders");
        const q = query(ordersRef, where("userId", "==", userId), where("status", "==", "active"));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) return;

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
        const now = Timestamp.now().toMillis();
        const currentUTCDay = new Date(now).getUTCDay();
        if (currentUTCDay === 0) {
            console.log("Sunday: Skipping global income sync.");
            return;
        }

        const ordersRef = collection(db, "UserOrders");
        const q = query(ordersRef, where("status", "==", "active"));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) return;

        for (const orderDoc of querySnapshot.docs) {
            await syncOrderIncome(orderDoc, now);
        }
        console.log(`Global income sync completed for ${querySnapshot.size} orders.`);
    } catch (error) {
        console.error("Error syncing all income:", error);
    }
}
