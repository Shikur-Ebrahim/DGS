
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function calculateDaysPassed(nowMillis, lastSyncMillis) {
    return Math.floor(nowMillis / MS_PER_DAY) - Math.floor(lastSyncMillis / MS_PER_DAY);
}

const tests = [
    {
        name: "Monday 18:00 purchase -> Tuesday 00:01 check",
        lastSync: new Date("2025-12-29T18:00:00Z").getTime(),
        now: new Date("2025-12-30T00:01:00Z").getTime(),
        expected: 1
    },
    {
        name: "Monday 23:59 purchase -> Tuesday 00:01 check",
        lastSync: new Date("2025-12-29T23:59:00Z").getTime(),
        now: new Date("2025-12-30T00:01:00Z").getTime(),
        expected: 1
    },
    {
        name: "Tuesday 00:01 purchase -> Tuesday 23:59 check",
        lastSync: new Date("2025-12-30T00:01:00Z").getTime(),
        now: new Date("2025-12-30T23:59:00Z").getTime(),
        expected: 0
    },
    {
        name: "Monday 18:00 purchase -> Wednesday 00:01 check",
        lastSync: new Date("2025-12-29T18:00:00Z").getTime(),
        now: new Date("2025-12-31T00:01:00Z").getTime(),
        expected: 2
    },
    {
        name: "Last sync Tuesday 00:00 (after 1st day sync) -> Wednesday 00:01 check",
        lastSync: new Date("2025-12-30T00:00:00Z").getTime(),
        now: new Date("2025-12-31T00:01:00Z").getTime(),
        expected: 1
    }
];

console.log("Running Income Logic Tests...");
let failed = false;
tests.forEach(test => {
    const result = calculateDaysPassed(test.now, test.lastSync);
    if (result === test.expected) {
        console.log(`✅ PASS: ${test.name}`);
    } else {
        console.log(`❌ FAIL: ${test.name} | Expected: ${test.expected}, Got: ${result}`);
        failed = true;
    }
});

if (!failed) {
    console.log("\nAll tests passed! The midnight logic is correct.");
} else {
    process.exit(1);
}
