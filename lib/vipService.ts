import { db } from "./firebase";
import { doc, updateDoc, getDoc, Timestamp, runTransaction } from "firebase/firestore";

export const VIP_RULES = [
    { level: 1, size: 15, assets: 70000, salary: 1500 },
    { level: 2, size: 40, assets: 300000, salary: 4000 },
    { level: 3, size: 80, assets: 800000, salary: 15000 },
    { level: 4, size: 150, assets: 1500000, salary: 30000 },
    { level: 5, size: 270, assets: 3500000, salary: 70000 },
    { level: 6, size: 400, assets: 8000000, salary: 350000 },
    { level: 7, size: 800, assets: 20000000, salary: 1500000 },
];

/**
 * Checks if the user qualifies for a higher VIP level based on current stats.
 * If so, updates their VIP level and sets the entry date.
 */
export async function checkAndUpgradeVIP(userId: string, currentTeamSize: number, currentTeamAssets: number) {
    if (!userId) return;

    try {
        const userRef = doc(db, "Customers", userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) return;

        const userData = userSnap.data();
        const currentVIP = userData.VIP || 0;

        // Find the highest eligible level
        let eligibleLevel = 0;
        for (const rule of VIP_RULES) {
            if (currentTeamSize >= rule.size && currentTeamAssets >= rule.assets) {
                eligibleLevel = rule.level;
            }
        }

        // Only upgrade, never downgrade automatically (unless specified otherwise)
        if (eligibleLevel > currentVIP) {
            await updateDoc(userRef, {
                VIP: eligibleLevel,
                vipEntryDate: Timestamp.now(), // Reset timer for salary on new level
                lastSalaryDate: Timestamp.now() // Salary starts counting from now
            });
            console.log(`User ${userId} upgraded to VIP ${eligibleLevel}`);
        }
    } catch (error) {
        console.error("Error checking VIP upgrade:", error);
    }
}

/**
 * Checks if a monthly salary is valid.
 * Salary is due if 30 days have passed since the last salary date (or vip entry date).
 */
export async function checkAndPaySalary(userId: string) {
    if (!userId) return;

    const MS_PER_DAY = 24 * 60 * 60 * 1000;
    const SALARY_INTERVAL = 30 * MS_PER_DAY; // 30 Days

    try {
        await runTransaction(db, async (transaction) => {
            const userRef = doc(db, "Customers", userId);
            const userSnap = await transaction.get(userRef);

            if (!userSnap.exists()) return;

            const userData = userSnap.data();
            const vipLevel = userData.VIP || 0;

            if (vipLevel === 0) return; // No salary for V0

            const rule = VIP_RULES.find(r => r.level === vipLevel);
            if (!rule) return;

            // Use lastSalaryDate or fallback to vipEntryDate
            const lastPaymentTime = userData.lastSalaryDate?.toMillis() || userData.vipEntryDate?.toMillis() || 0;
            const now = Timestamp.now().toMillis();

            if (now - lastPaymentTime >= SALARY_INTERVAL) {
                // Pay Salary
                const newInviteWallet = (userData.inviteWallet || 0) + rule.salary;

                transaction.update(userRef, {
                    inviteWallet: newInviteWallet,
                    totalTeamIncome: (userData.totalTeamIncome || 0) + rule.salary,
                    lastSalaryDate: Timestamp.now()
                });

                console.log(`Paid monthly salary of ${rule.salary} to ${userId} (VIP ${vipLevel})`);
            }
        });
    } catch (error) {
        console.error("Error paying salary:", error);
    }
}
