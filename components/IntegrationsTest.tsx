"use client";

import { useEffect, useState } from "react";
import { app } from "@/lib/firebase";
import ImageUpload from "./ImageUpload";

export default function IntegrationsTest() {
    const [firebaseStatus, setFirebaseStatus] = useState("Checking...");

    useEffect(() => {
        if (app) {
            setFirebaseStatus("Firebase Initialized: " + app.name);
            console.log("Firebase App:", app);
        } else {
            setFirebaseStatus("Firebase Initialization Failed");
        }
    }, []);

    return (
        <div className="mt-8 p-6 bg-white rounded-xl shadow-lg border border-gray-200 w-full max-w-md text-left">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Integrations Test</h2>

            <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-2">Firebase</h3>
                <div className={`p-3 rounded-md ${firebaseStatus.includes("Initialized") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                    {firebaseStatus}
                </div>
            </div>

            <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-2">Cloudinary</h3>
                <p className="text-sm text-gray-600 mb-2">Click below to test uploading an image:</p>
                <ImageUpload onUpload={(result) => {
                    console.log("Upload result:", result);
                    alert("Upload successful! Check console for details.");
                }} />
            </div>
        </div>
    );
}
