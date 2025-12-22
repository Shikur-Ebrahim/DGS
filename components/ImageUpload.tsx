"use client";

import { CldUploadWidget } from "next-cloudinary";

interface ImageUploadProps {
    onUpload: (result: any) => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onUpload }) => {
    return (
        <CldUploadWidget
            uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
            onSuccess={(result) => onUpload(result)}
        >
            {({ open }) => {
                return (
                    <button
                        onClick={() => open()}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
                    >
                        Upload Image
                    </button>
                );
            }}
        </CldUploadWidget>
    );
};

export default ImageUpload;
