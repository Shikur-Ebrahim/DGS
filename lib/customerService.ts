import { db, auth } from "./firebase";
import { collection, query, where, getDocs, setDoc, doc, Timestamp } from "firebase/firestore";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";

export interface CustomerData {
    email: string;
    phoneNumber: string;
    country: string;
    password: string; // Used for Auth, not stored in Firestore
    uid?: string;
    referralCode: string; // Last 8 digits of phone number
    createdAt: Timestamp;
    // Wallet Tracking
    balanceWallet: number;
    taskWallet: number;
    inviteWallet: number;
    totalTeamIncome: number;
    // Income Tracking
    totalIncome: number;
    dailyIncome: number;
    // Product Tracking
    productName: string | null;
    productPrice: number;
    // Inviter Hierarchy
    inviterA: string | null; // direct inviter
    inviterB: string | null; // inviter of inviter A
    inviterC: string | null; // inviter of inviter B
    inviterD: string | null; // inviter of inviter C

    VIP: number;
}

/**
 * Check if an email already exists in the Customers collection
 */
export async function checkEmailExists(email: string): Promise<boolean> {
    const customersRef = collection(db, "Customers");
    const q = query(customersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
}

/**
 * Check if a phone number already exists in the Customers collection
 */
export async function checkPhoneExists(phoneNumber: string): Promise<boolean> {
    const customersRef = collection(db, "Customers");
    const q = query(customersRef, where("phoneNumber", "==", phoneNumber));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
}

/**
 * Register a new customer in Firebase Auth and Customers collection
 */
export async function registerCustomer(
    data: Omit<CustomerData, "createdAt" | "uid" | "referralCode" | "balanceWallet" | "taskWallet" | "inviteWallet" | "totalTeamIncome" | "totalIncome" | "dailyIncome" | "productName" | "productPrice" | "inviterA" | "inviterB" | "inviterC" | "inviterD" | "VIP">,
    invitationCode?: string
): Promise<string> {
    // Check if phone already exists
    const phoneExists = await checkPhoneExists(data.phoneNumber);
    if (phoneExists) {
        throw new Error("This phone number is already registered");
    }

    // Resolve inviter hierarchy
    let inviterA: string | null = null;
    let inviterB: string | null = null;
    let inviterC: string | null = null;
    let inviterD: string | null = null;

    if (invitationCode) {
        // Find inviter by referralCode
        const inviterSnap = await getDocs(query(collection(db, "Customers"), where("referralCode", "==", invitationCode)));

        if (!inviterSnap.empty) {
            const inviterDoc = inviterSnap.docs[0];
            const inviterData = inviterDoc.data() as CustomerData;

            // Use the document ID as the uid, which is safer/guaranteed
            inviterA = inviterDoc.id;

            // Shift the hierarchy for the new user:
            // NewUser.inviterB = Inviter.inviterA (The inviter of the current inviter)
            inviterB = inviterData.inviterA || null;

            // NewUser.inviterC = Inviter.inviterB (The grand-inviter)
            inviterC = inviterData.inviterB || null;

            // NewUser.inviterD = Inviter.inviterC (The great-grand-inviter)
            inviterD = inviterData.inviterC || null;
        }
    }

    // Generate Referral Code (Last 8 digits of phone number)
    const referralCode = data.phoneNumber.slice(-8);

    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
    const user = userCredential.user;

    // Add customer to Firestore using Auth UID as document ID
    await setDoc(doc(db, "Customers", user.uid), {
        email: data.email,
        phoneNumber: data.phoneNumber,
        country: data.country,
        uid: user.uid,
        referralCode,
        createdAt: Timestamp.now(),
        // Default values for automatic fields
        balanceWallet: 0,
        taskWallet: 0,
        inviteWallet: 0,
        totalTeamIncome: 0,
        totalIncome: 0,
        dailyIncome: 0,
        productName: null,
        productPrice: 0,
        inviterA,
        inviterB,
        inviterC,
        inviterD,
        VIP: 0,
    });

    return user.uid;
}

/**
 * Login a customer using phone number and password
 */
export async function loginWithPhone(phoneNumber: string, password: string): Promise<string> {
    // 1. Find email by phone number
    const customersRef = collection(db, "Customers");
    const q = query(customersRef, where("phoneNumber", "==", phoneNumber));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        throw new Error("Phone number not found");
    }

    const userData = querySnapshot.docs[0].data();
    const email = userData.email;

    // 2. Sign in with email and password
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user.uid;
}

