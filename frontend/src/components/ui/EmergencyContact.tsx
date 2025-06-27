import React from 'react';

interface EmergencyContact {
    name: string;
    category: string;
    number: string;
}

interface EmergencyContactsProps {
    isVisible: boolean;
    onClose: () => void;
}

const emergencyContact: EmergencyContact[] = [
    {
        name: "Quezon City Disaster Risk Reduction",
        category: "Emergency",
        number: "911"
    },
    {
        name: "Bureau of Fire Protection",
        category: "Fire",
        number: "(02) 426-0219"
    },
    {
        name: "MMDA Flood Control",
        category: "Flood",
        number: "(02) 882-4150"
    },
    {
        name: "Philippine Red Cross",
        category: "Medical",
        number: "143"
    }
];

export const EmergencyContacts: React.FC<EmergencyContactsProps> = ({ isVisible, onClose }) => {
    if (!isVisible) return null;

    return (
        <div className="mt-4 bg-white rounded-lg shadow-lg border-l-8 border-l-[#066AAA] overflow-hidden">
            <div className=" px-4 flex items-center justify-between">
                <div className="flex items-center text-slate-700">
                    <h3 className="text-lg font-semibold">Emergency Contacts</h3>
                </div>
                <button
                    onClick={onClose}
                    className="text-white hover:text-gray-200 transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div className="p-4 space-y-3">
                {emergencyContact.map((contact, index) => (
                    <div key={index} className="bg-blue-50 p-4 rounded-lg flex items-center justify-between hover:bg-blue-100 transition-colors">
                        <div>
                            <h4 className="font-semibold w-[70%] text-gray-800">{contact.name}</h4>
                            <p className="text-sm text-gray-600">{contact.category}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-lg font-semibold text-sl">{contact.number}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};