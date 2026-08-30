'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    X,
    Mail,
    Phone,
    MapPin,
    Link as LinkIcon,
    MessageCircle,
    Twitter,
    Globe,
    Lock,
    Eye,
    EyeOff,
    Plus,
    Trash2,
    Calendar
} from 'lucide-react';

interface ContactModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface EmailEntry {
    id: string;
    value: string;
    privacy: 'public' | 'registered' | 'limited' | 'private';
}

interface PhoneEntry {
    id: string;
    value: string;
    privacy: 'public' | 'registered' | 'limited' | 'private';
}

interface WebsiteEntry {
    id: string;
    value: string;
    label: string;
}

interface IMHandle {
    id: string;
    platform: string;
    value: string;
}

const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose }) => {
    const [profileUrl, setProfileUrl] = useState('');
    const [emails, setEmails] = useState<EmailEntry[]>([
        { id: '1', value: '', privacy: 'public' }
    ]);
    const [phones, setPhones] = useState<PhoneEntry[]>([
        { id: '1', value: '', privacy: 'limited' }
    ]);
    const [birthday, setBirthday] = useState('');
    const [hideYear, setHideYear] = useState(false);
    const [address, setAddress] = useState('');
    const [addressPrivacy, setAddressPrivacy] = useState<'public' | 'registered' | 'limited' | 'private'>('limited');
    const [websites, setWebsites] = useState<WebsiteEntry[]>([
        { id: '1', value: '', label: '' }
    ]);
    const [imHandles, setImHandles] = useState<IMHandle[]>([
        { id: '1', platform: 'whatsapp', value: '' }
    ]);
    const [twitter, setTwitter] = useState('');
    const [connectedApps, setConnectedApps] = useState({
        instagram: false,
        linkedin: false,
        github: false,
        dribbble: false
    });

    const privacyLevels: Array<'public' | 'registered' | 'limited' | 'private'> = [
        'public',
        'registered',
        'limited',
        'private'
    ];

    const privacyLabels = {
        public: 'Public',
        registered: 'Registered Users',
        limited: 'Connections Only',
        private: 'Private'
    };

    const privacyDescriptions = {
        public: 'Visible to everyone',
        registered: 'Visible to registered users',
        limited: 'Visible to connections only',
        private: 'Only you can see this'
    };

    const imPlatforms = [
        { id: 'whatsapp', label: 'WhatsApp' },
        { id: 'skype', label: 'Skype' },
        { id: 'telegram', label: 'Telegram' },
        { id: 'messenger', label: 'Messenger' }
    ];

    const addEmail = () => {
        const newId = (Math.random()).toString(36).substr(2, 9);
        setEmails([...emails, { id: newId, value: '', privacy: 'limited' }]);
    };

    const removeEmail = (id: string) => {
        setEmails(emails.filter(e => e.id !== id));
    };

    const updateEmail = (id: string, value: string, privacy: 'public' | 'registered' | 'limited' | 'private') => {
        setEmails(emails.map(e => e.id === id ? { ...e, value, privacy } : e));
    };

    const addPhone = () => {
        const newId = (Math.random()).toString(36).substr(2, 9);
        setPhones([...phones, { id: newId, value: '', privacy: 'limited' }]);
    };

    const removePhone = (id: string) => {
        setPhones(phones.filter(p => p.id !== id));
    };

    const updatePhone = (id: string, value: string, privacy: 'public' | 'registered' | 'limited' | 'private') => {
        setPhones(phones.map(p => p.id === id ? { ...p, value, privacy } : p));
    };

    const addWebsite = () => {
        const newId = (Math.random()).toString(36).substr(2, 9);
        setWebsites([...websites, { id: newId, value: '', label: '' }]);
    };

    const removeWebsite = (id: string) => {
        setWebsites(websites.filter(w => w.id !== id));
    };

    const updateWebsite = (id: string, value: string, label: string) => {
        setWebsites(websites.map(w => w.id === id ? { ...w, value, label } : w));
    };

    const addIMHandle = () => {
        const newId = (Math.random()).toString(36).substr(2, 9);
        setImHandles([...imHandles, { id: newId, platform: 'whatsapp', value: '' }]);
    };

    const removeIMHandle = (id: string) => {
        setImHandles(imHandles.filter(im => im.id !== id));
    };

    const updateIMHandle = (id: string, platform: string, value: string) => {
        setImHandles(imHandles.map(im => im.id === id ? { ...im, platform, value } : im));
    };

    const toggleConnectedApp = (app: string) => {
        setConnectedApps(prev => ({
            ...prev,
            [app]: !prev[app as keyof typeof prev]
        }));
    };

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    // ✅ Scroll lock when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen || !mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            ></div>

            {/* Modal */}
            <div className="relative z-10 w-full max-w-4xl mx-auto max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-[#4a3728] to-[#6a5748] px-6 py-4 z-20 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-white">Contact Information</h2>
                        <p className="text-white/70 text-xs mt-0.5">Manage your contact details and privacy settings</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-white/10 rounded-full transition-colors duration-200"
                    >
                        <X className="w-5 h-5 text-white" />
                    </button>
                </div>

                              {/* Content */}
                              <div className="overflow-y-auto max-h-[calc(90vh-140px)] px-6 py-3">
                              <div className="space-y-3">
                        {/* Profile URL */}
                        <div className="bg-gradient-to-r from-[#f6ede8] to-[#e0d8cf]/50 rounded-2xl p-4 border border-[#e0d8cf]">
                            <div className="flex items-center gap-2 mb-3">
                                <Globe className="w-4 h-4 text-[#4a3728]" />
                                <h3 className="text-base font-semibold text-[#4a3728]">Profile URL</h3>
                            </div>
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={profileUrl}
                                    onChange={(e) => setProfileUrl(e.target.value)}
                                    className="flex-1 px-4 py-3 rounded-lg border border-[#d4ccc3] focus:outline-none focus:ring-2 focus:ring-[#4a3728] text-[#4a3728] placeholder-[#4a3728]/50"
                                    placeholder="your-custom-url"
                                />
                                <button className="px-6 py-3 bg-[#4a3728] text-white rounded-lg hover:bg-[#6a5748] transition-colors duration-200 font-semibold">
                                    Save
                                </button>
                            </div>
                            <p className="text-sm text-[#4a3728]/70 mt-3">yoursite.com/profile/{profileUrl}</p>
                        </div>

                        {/* Email Addresses */}
                        <div className="bg-gradient-to-r from-[#f6ede8] to-[#e0d8cf]/50 rounded-2xl p-4 border border-[#e0d8cf]">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-[#4a3728]" />
                                    <h3 className="text-base font-semibold text-[#4a3728]">Email Addresses</h3>
                                    <span className="text-sm text-[#4a3728]/60">({emails.length}/3)</span>
                                </div>
                                {emails.length < 3 && (
                                    <button
                                        onClick={addEmail}
                                        className="flex items-center gap-2 px-3 py-2 bg-[#4a3728] text-white rounded-lg hover:bg-[#6a5748] transition-colors duration-200 text-sm font-semibold"
                                    >
                                        <Plus className="w-4 h-4" /> Add
                                    </button>
                                )}
                            </div>
                            <div className="space-y-4">
                                {emails.map((email) => (
                                    <div key={email.id} className="bg-white rounded-lg p-4 border border-[#e0d8cf]">
                                        <div className="flex gap-3 mb-3">
                                            <input
                                                type="email"
                                                value={email.value}
                                                onChange={(e) => updateEmail(email.id, e.target.value, email.privacy)}
                                                className="flex-1 px-3 py-2 rounded border border-[#d4ccc3] focus:outline-none focus:ring-2 focus:ring-[#4a3728] text-sm text-[#4a3728] font-medium"
                                                placeholder="your@email.com"
                                            />
                                            <button
                                                onClick={() => removeEmail(email.id)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Lock className="w-4 h-4 text-[#4a3728]" />
                                            <select
                                                value={email.privacy}
                                                onChange={(e) => updateEmail(email.id, email.value, e.target.value as any)}
                                                className="flex-1 px-3 py-2 rounded border border-[#d4ccc3] focus:outline-none focus:ring-2 focus:ring-[#4a3728] text-sm bg-white text-[#4a3728] font-semibold"
                                            >
                                                {privacyLevels.map(level => (
                                                    <option key={level} value={level} className="text-[#4a3728] bg-white" style={{ color: '#4a3728', backgroundColor: '#ffffff' }}>
                                                        {privacyLabels[level]} - {privacyDescriptions[level]}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Phone Numbers */}
                        <div className="bg-gradient-to-r from-[#f6ede8] to-[#e0d8cf]/50 rounded-2xl p-4 border border-[#e0d8cf]">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-[#4a3728]" />
                                    <h3 className="text-base font-semibold text-[#4a3728]">Phone Numbers</h3>
                                    <span className="text-sm text-[#4a3728]/60">({phones.length}/3)</span>
                                </div>
                                {phones.length < 3 && (
                                    <button
                                        onClick={addPhone}
                                        className="flex items-center gap-2 px-3 py-2 bg-[#4a3728] text-white rounded-lg hover:bg-[#6a5748] transition-colors duration-200 text-sm font-semibold"
                                    >
                                        <Plus className="w-4 h-4" /> Add
                                    </button>
                                )}
                            </div>
                            <div className="space-y-4">
                                {phones.map((phone) => (
                                    <div key={phone.id} className="bg-white rounded-lg p-4 border border-[#e0d8cf]">
                                        <div className="flex gap-3 mb-3">
                                            <input
                                                type="tel"
                                                value={phone.value}
                                                onChange={(e) => updatePhone(phone.id, e.target.value, phone.privacy)}
                                                className="flex-1 px-3 py-2 rounded border border-[#d4ccc3] focus:outline-none focus:ring-2 focus:ring-[#4a3728] text-sm text-[#4a3728] font-medium"
                                                placeholder="+1 (555) 000-0000"
                                            />
                                            <button
                                                onClick={() => removePhone(phone.id)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Lock className="w-4 h-4 text-[#4a3728]" />
                                            <select
                                                value={phone.privacy}
                                                onChange={(e) => updatePhone(phone.id, phone.value, e.target.value as any)}
                                                className="flex-1 px-3 py-2 rounded border border-[#d4ccc3] focus:outline-none focus:ring-2 focus:ring-[#4a3728] text-sm bg-white text-[#4a3728] font-semibold"
                                            >
                                                {privacyLevels.map(level => (
                                                    <option key={level} value={level} className="text-[#4a3728] bg-white" style={{ color: '#4a3728', backgroundColor: '#ffffff' }}>
                                                        {privacyLabels[level]} - {privacyDescriptions[level]}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Birthday */}
                        <div className="bg-gradient-to-r from-[#f6ede8] to-[#e0d8cf]/50 rounded-2xl p-4 border border-[#e0d8cf]">
                            <div className="flex items-center gap-2 mb-3">
                                <Calendar className="w-4 h-4 text-[#4a3728]" />
                                <h3 className="text-base font-semibold text-[#4a3728]">Birthday</h3>
                            </div>
                            <div className="space-y-4">
                                <input
                                    type="date"
                                    value={birthday}
                                    onChange={(e) => setBirthday(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-[#d4ccc3] focus:outline-none focus:ring-2 focus:ring-[#4a3728] text-[#4a3728]"
                                />
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={hideYear}
                                        onChange={(e) => setHideYear(e.target.checked)}
                                        className="w-5 h-5 rounded border-[#d4ccc3] focus:ring-[#4a3728]"
                                    />
                                    <span className="text-[#4a3728]">Hide birth year from profile</span>
                                </label>
                                <div className="flex items-center gap-2 pt-2">
                                    <Lock className="w-4 h-4 text-[#4a3728]" />
                                    <select className="flex-1 px-3 py-2 rounded border border-[#d4ccc3] focus:outline-none focus:ring-2 focus:ring-[#4a3728] text-sm bg-white text-[#4a3728] font-semibold">
                                        {privacyLevels.map(level => (
                                            <option key={level} value={level} className="text-[#4a3728] bg-white" style={{ color: '#4a3728', backgroundColor: '#ffffff' }}>
                                                {privacyLabels[level]} - {privacyDescriptions[level]}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Address/Location */}
                        <div className="bg-gradient-to-r from-[#f6ede8] to-[#e0d8cf]/50 rounded-2xl p-4 border border-[#e0d8cf]">
                            <div className="flex items-center gap-2 mb-3">
                                <MapPin className="w-4 h-4 text-[#4a3728]" />
                                <h3 className="text-base font-semibold text-[#4a3728]">Address/Location</h3>
                            </div>
                            <div className="space-y-4">
                                <input
                                    type="text"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-[#d4ccc3] focus:outline-none focus:ring-2 focus:ring-[#4a3728] text-[#4a3728] placeholder-[#4a3728]/50"
                                    placeholder="City, State, Country"
                                />
                                <div className="flex items-center gap-2">
                                    <Lock className="w-4 h-4 text-[#4a3728]" />
                                    <select
                                        value={addressPrivacy}
                                        onChange={(e) => setAddressPrivacy(e.target.value as any)}
                                        className="flex-1 px-3 py-2 rounded border border-[#d4ccc3] focus:outline-none focus:ring-2 focus:ring-[#4a3728] text-sm bg-white text-[#4a3728] font-semibold"
                                    >
                                        {privacyLevels.map(level => (
                                            <option key={level} value={level} className="text-[#4a3728] bg-white" style={{ color: '#4a3728', backgroundColor: '#ffffff' }}>
                                                {privacyLabels[level]} - {privacyDescriptions[level]}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Websites */}
                        <div className="bg-gradient-to-r from-[#f6ede8] to-[#e0d8cf]/50 rounded-2xl p-4 border border-[#e0d8cf]">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <LinkIcon className="w-4 h-4 text-[#4a3728]" />
                                    <h3 className="text-base font-semibold text-[#4a3728]">Websites</h3>
                                    <span className="text-sm text-[#4a3728]/60">({websites.length}/3)</span>
                                </div>
                                {websites.length < 3 && (
                                    <button
                                        onClick={addWebsite}
                                        className="flex items-center gap-2 px-3 py-2 bg-[#4a3728] text-white rounded-lg hover:bg-[#6a5748] transition-colors duration-200 text-sm font-semibold"
                                    >
                                        <Plus className="w-4 h-4" /> Add
                                    </button>
                                )}
                            </div>
                            <div className="space-y-4">
                                {websites.map((website) => (
                                    <div key={website.id} className="bg-white rounded-lg p-4 border border-[#e0d8cf]">
                                        <div className="grid grid-cols-2 gap-3 mb-3">
                                            <input
                                                type="text"
                                                value={website.label}
                                                onChange={(e) => updateWebsite(website.id, website.value, e.target.value)}
                                                className="px-3 py-2 rounded border border-[#d4ccc3] focus:outline-none focus:ring-2 focus:ring-[#4a3728] text-sm text-[#4a3728] font-medium"
                                                placeholder="e.g., Portfolio"
                                            />
                                            <div className="flex gap-2">
                                                <input
                                                    type="url"
                                                    value={website.value}
                                                    onChange={(e) => updateWebsite(website.id, e.target.value, website.label)}
                                                    className="flex-1 px-3 py-2 rounded border border-[#d4ccc3] focus:outline-none focus:ring-2 focus:ring-[#4a3728] text-sm text-[#4a3728] font-medium"
                                                    placeholder="https://example.com"
                                                />
                                                <button
                                                    onClick={() => removeWebsite(website.id)}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* IM Handles */}
                        <div className="bg-gradient-to-r from-[#f6ede8] to-[#e0d8cf]/50 rounded-2xl p-4 border border-[#e0d8cf]">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <MessageCircle className="w-4 h-4 text-[#4a3728]" />
                                    <h3 className="text-base font-semibold text-[#4a3728]">IM Handles</h3>
                                </div>
                                {imHandles.length < 4 && (
                                    <button
                                        onClick={addIMHandle}
                                        className="flex items-center gap-2 px-3 py-2 bg-[#4a3728] text-white rounded-lg hover:bg-[#6a5748] transition-colors duration-200 text-sm font-semibold"
                                    >
                                        <Plus className="w-4 h-4" /> Add
                                    </button>
                                )}
                            </div>
                            <div className="space-y-4">
                                {imHandles.map((im) => (
                                    <div key={im.id} className="bg-white rounded-lg p-4 border border-[#e0d8cf]">
                                        <div className="flex gap-3">
                                            <select
                                                value={im.platform}
                                                onChange={(e) => updateIMHandle(im.id, e.target.value, im.value)}
                                                className="flex-1 px-3 py-2 rounded border border-[#d4ccc3] focus:outline-none focus:ring-2 focus:ring-[#4a3728] text-sm bg-white text-[#4a3728] font-semibold"
                                            >
                                                {imPlatforms.map(platform => (
                                                    <option key={platform.id} value={platform.id} className="text-[#4a3728] bg-white" style={{ color: '#4a3728', backgroundColor: '#ffffff' }}>
                                                        {platform.label}
                                                    </option>
                                                ))}
                                            </select>
                                            <input
                                                type="text"
                                                value={im.value}
                                                onChange={(e) => updateIMHandle(im.id, im.platform, e.target.value)}
                                                className="flex-1 px-3 py-2 rounded border border-[#d4ccc3] focus:outline-none focus:ring-2 focus:ring-[#4a3728] text-sm text-[#4a3728] font-medium"
                                                placeholder="Handle/ID"
                                            />
                                            <button
                                                onClick={() => removeIMHandle(im.id)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Twitter Handle */}
                        <div className="bg-gradient-to-r from-[#f6ede8] to-[#e0d8cf]/50 rounded-2xl p-4 border border-[#e0d8cf]">
                            <div className="flex items-center gap-2 mb-3">
                                <Twitter className="w-4 h-4 text-[#4a3728]" />
                                <h3 className="text-base font-semibold text-[#4a3728]">Twitter Handle</h3>
                            </div>
                            <input
                                type="text"
                                value={twitter}
                                onChange={(e) => setTwitter(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border border-[#d4ccc3] focus:outline-none focus:ring-2 focus:ring-[#4a3728] text-[#4a3728] placeholder-[#4a3728]/50"
                                placeholder="@yourhandle"
                            />
                        </div>

                        {/* Connected Apps */}
                        <div className="bg-gradient-to-r from-[#f6ede8] to-[#e0d8cf]/50 rounded-2xl p-4 border border-[#e0d8cf]">
                            <div className="flex items-center gap-2 mb-3">
                                <Globe className="w-4 h-4 text-[#4a3728]" />
                                <h3 className="text-base font-semibold text-[#4a3728]">Connected Apps & Sync</h3>
                            </div>
                            <div className="space-y-3">
                                {Object.entries({
                                    instagram: 'Instagram',
                                    linkedin: 'LinkedIn',
                                    github: 'GitHub',
                                    dribbble: 'Dribbble'
                                }).map(([key, label]) => (
                                    <div key={key} className="bg-white rounded-lg p-4 border border-[#e0d8cf] flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Globe className="w-4 h-4 text-[#4a3728]" />
                                            <span className="text-[#4a3728] font-medium">{label}</span>
                                        </div>
                                        <button
                                            onClick={() => toggleConnectedApp(key)}
                                            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                                                connectedApps[key as keyof typeof connectedApps]
                                                    ? 'bg-[#4a3728]'
                                                    : 'bg-gray-300'
                                            }`}
                                        >
                                            <span
                                                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                                                    connectedApps[key as keyof typeof connectedApps]
                                                        ? 'translate-x-7'
                                                        : 'translate-x-1'
                                                }`}
                                            />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>


                                {/* Footer */}

                <div className="sticky bottom-0 px-8 py-4 border-t border-[#e0d8cf] bg-white flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-6 py-3 rounded-full bg-gray-200 text-[#4a3728] font-semibold hover:bg-gray-300 transition-all duration-200"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 px-6 py-3 rounded-full bg-gradient-to-r from-[#4a3728] to-[#6a5748] text-white font-semibold hover:shadow-lg transition-all duration-200"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ContactModal;
