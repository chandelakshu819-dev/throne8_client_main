'use client';

import React, { useState, useRef, useEffect  } from 'react';
import { X, Upload} from 'lucide-react';
import AuthService from '@/lib/api/auth.service';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { profilePhotoValidationSchema } from '../../validators/profilePhoto.validation';

interface ProfileImageModalProps {
    isOpen?: boolean;
    onClose?: () => void;
    onUploadSuccess?: (imageUrl: string) => void;
    currentImageUrl?: string;
}

const DEFAULT_PROFILE_IMAGE_URL = 'https://i.pinimg.com/736x/f6/61/ea/f661ea61616909838a9fbfeda0d2ea14.jpg';

const ProfileImageModal: React.FC<ProfileImageModalProps> = ({
    isOpen = false,
    onClose = () => { },
    onUploadSuccess,
    currentImageUrl = '',
}) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string>('');
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { uploadUserProfileImage } = useProfile();

   
    const isDefaultImage = !currentImageUrl || currentImageUrl === DEFAULT_PROFILE_IMAGE_URL;
    const hasActualImage = currentImageUrl && currentImageUrl !== DEFAULT_PROFILE_IMAGE_URL;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            validateAndSetFile(file);
        }
    };

    const validateAndSetFile = (file: File) => {
        setError('');

        try {
           
            profilePhotoValidationSchema.parse({ file, setAsActive: true });

            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        } catch (error: any) {
            if (error.errors && error.errors[0]) {
                setError(error.errors[0].message);
            } else {
                setError('Invalid file selected');
            }
        }
    };

    const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const file = e.dataTransfer.files?.[0];
        if (file) {
            validateAndSetFile(file);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            setError('Please select an image first');
            return;
        }

        setIsUploading(true);
        setError('');

        try {
           

           
            const uploadedImageUrl = await uploadUserProfileImage(selectedFile).unwrap();

           

           
            if (onUploadSuccess && uploadedImageUrl) {
                onUploadSuccess(uploadedImageUrl);
            }

            resetModal();
            onClose();
        } catch (error: any) {
            console.error('❌ Error uploading profile image:', error);
            setError(error.message || 'Failed to upload image. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    const resetModal = () => {
        setSelectedFile(null);
        setPreviewUrl('');
        setError('');
        setDragActive(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleClose = () => {
        resetModal();
        onClose();
    };

    // Lock background page scroll while modal is open
    useEffect(() => {
        if (isOpen) {
            const originalOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = originalOverflow;
            };
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Transparent Overlay Background */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={handleClose}
            ></div>

            {/* Modal Content */}
            <div className="relative z-10 w-full max-w-2xl mx-auto max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between sticky top-0 bg-gradient-to-r from-[#4a3728] to-[#6a5748] px-6 py-5 z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Upload Profile Image</h2>
                        <p className="text-white/70 text-sm mt-1">Choose a professional profile picture</p>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={isUploading}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors duration-200 disabled:opacity-50"
                    >
                        <X className="w-6 h-6 text-white" />
                    </button>
                </div>

                {/* Form Body */}
                <div className="overflow-y-scroll max-h-[calc(90vh-80px)] p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    <div className="space-y-6">
                        {/* Current Image Preview - Show only when actual image exists and no new preview */}
                        {hasActualImage && !previewUrl && (
                            <div className="mb-6">
                                <label className="block mb-3 text-sm font-semibold text-[#4a3728]">
                                    Current Profile Picture
                                </label>
                                <div className="relative w-48 h-48 rounded-2xl overflow-hidden border-2 border-[#e0d8cf] bg-gray-100 mx-auto">
                                    <img
                                        src={currentImageUrl}
                                        alt="Current Profile"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Error Message */}
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                                {error}
                            </div>
                        )}

                        {/* Upload Section - Only show for default images or when changing image */}
                        {isDefaultImage || previewUrl ? (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-[#4a3728] flex items-center gap-2">
                                    <span className="text-2xl">🖼️</span> {previewUrl ? 'New Profile Picture' : 'Choose Profile Picture'}
                                </h3>

                                {/* Drag and Drop Area - Only show when no preview */}
                                {!previewUrl && (
                                    <div
                                        onDragEnter={handleDrag}
                                        onDragLeave={handleDrag}
                                        onDragOver={handleDrag}
                                        onDrop={handleDrop}
                                        className={`relative border-2 border-dashed rounded-2xl p-8 transition-all duration-200 cursor-pointer ${dragActive
                                            ? 'border-[#4a3728] bg-[#4a3728]/5'
                                            : 'border-[#e0d8cf] bg-white/30 hover:bg-white/50'
                                            }`}
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            className="hidden"
                                            disabled={isUploading}
                                        />

                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className="p-3 bg-gradient-to-r from-[#4a3728]/10 to-[#6a5748]/10 rounded-full">
                                                <Upload className="w-8 h-8 text-[#4a3728]" />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm font-semibold text-[#4a3728]">
                                                    Drag and drop your image here
                                                </p>
                                                <p className="text-xs text-[#4a3728]/60 mt-1">
                                                    or click to browse from your computer
                                                </p>
                                            </div>
                                            <p className="text-xs text-[#4a3728]/50">
                                                Supported formats: JPG, PNG, GIF (Max 5MB)
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Preview Section */}
                                {previewUrl && (
                                    <div className="space-y-4">
                                        <div className="relative w-48 h-48 rounded-2xl overflow-hidden border-2 border-[#e0d8cf] bg-gray-100 mx-auto">
                                            <img
                                                src={previewUrl}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>

                                        <div className="bg-gradient-to-r from-[#f6ede8] to-[#e0d8cf]/50 rounded-2xl border border-[#e0d8cf] p-4 space-y-3">
                                            <div>
                                                <p className="text-xs uppercase tracking-wide text-[#4a3728]/60 font-semibold">File Name</p>
                                                <p className="text-sm font-medium text-[#4a3728] truncate mt-1">{selectedFile?.name}</p>
                                            </div>
                                            <div className="pt-2 border-t border-[#e0d8cf]">
                                                <p className="text-xs uppercase tracking-wide text-[#4a3728]/60 font-semibold">File Size</p>
                                                <p className="text-sm font-medium text-[#4a3728] mt-1">{(selectedFile?.size! / 1024 / 1024).toFixed(2)} MB</p>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedFile(null);
                                                setPreviewUrl('');
                                                if (fileInputRef.current) {
                                                    fileInputRef.current.value = '';
                                                }
                                            }}
                                            className="w-full text-center text-sm text-[#4a3728] font-semibold py-2.5 rounded-xl hover:bg-[#f6ede8] transition-colors duration-200 border border-[#e0d8cf]"
                                        >
                                            Change Image
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : null}

                        {/* Change Photo Button - Only show for actual images */}
                        {hasActualImage && !previewUrl && (
                            <div className="flex gap-3 mt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        fileInputRef.current?.click();
                                    }}
                                    className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-[#4a3728] to-[#6a5748] text-white font-semibold hover:shadow-lg transition-all duration-200"
                                >
                                    Change Photo
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    disabled={isUploading}
                                />
                            </div>
                        )}

</div>

{/* Footer */}
<div className="sticky bottom-0 flex gap-3 mt-4 pt-3 bg-white">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isUploading}
                            className="flex-1 px-6 py-3 rounded-full border-2 border-[#e0d8cf] text-[#4a3728] font-semibold hover:bg-[#f6ede8]/50 transition-colors duration-200 disabled:opacity-50"
                        >
                            {previewUrl || !hasActualImage ? 'Cancel' : 'Close'}
                        </button>
                        {(previewUrl || isDefaultImage) && (
                            <button
                                type="button"
                                onClick={handleUpload}
                                disabled={!selectedFile || isUploading}
                                className="flex-1 px-6 py-3 rounded-full bg-gradient-to-r from-[#4a3728] to-[#6a5748] text-white font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isUploading ? 'Uploading...' : 'Upload Image'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileImageModal;