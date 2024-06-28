import React, { useState } from "react";
import { LinkedAction, ActionParameter } from "@solana/actions";

interface ActionFormProps {
    action: LinkedAction;
    onSubmit: (href: string) => void;
    baseUrl: string;
}

const ActionForm: React.FC<ActionFormProps> = ({ action, onSubmit, baseUrl }) => {
    const [params, setParams] = useState<Record<string, string>>({});

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        let updatedHref = action.href;

        // Replace any parameters in the href with their corresponding values from the form params
        Object.entries(params).forEach(([key, value]) => {
            updatedHref = updatedHref.replace(`{${key}}`, encodeURIComponent(value));
        });

        // If the href is a relative path, prepend the baseUrl
        if (!updatedHref.startsWith('http')) {
            updatedHref = new URL(updatedHref, baseUrl).toString();
        }

        onSubmit(updatedHref);
    };

    const handleParamChange = (name: string, value: string) => {
        setParams(prev => ({ ...prev, [name]: value }));
    };

    return (
        <form onSubmit={handleSubmit} className="w-full">
            {action.parameters?.map((param: ActionParameter) => (
                <div key={param.name} className="mb-2">
                    <label htmlFor={param.name} className="block text-sm font-medium text-gray-700 ">
                        {param.label || param.name}
                    </label>
                    <input
                        type="text"
                        id={param.name}
                        name={param.name}
                        required={param.required}
                        onChange={(e) => handleParamChange(param.name, e.target.value)}
                        className="min-w-max px-4 py-2 mt-1 text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder={`Enter ${param.label || param.name}`}
                    />
                </div>
            ))}
            <button
                type="submit"
                className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
                {action.label}
            </button>
        </form>
    );
};

export default ActionForm;