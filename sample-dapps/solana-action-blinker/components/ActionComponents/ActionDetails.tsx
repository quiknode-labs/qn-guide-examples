import React from "react";
import Image from "next/image";

interface ActionDetailsProps {
    icon: string;
    title: string;
    description: string;
    label: string;
    disabled?: boolean;
}

const ActionDetails: React.FC<ActionDetailsProps> = ({ icon, title, description, label, disabled }) => (
    <>
        <Image src={icon} width={50} height={50} alt={title} />
        <div><strong>Title:</strong> {title}</div>
        <div><strong>Description:</strong> {description}</div>
        <div><strong>Label:</strong> {label} </div>
        <div><strong>Disabled:</strong> {disabled ? 'Yes' : 'No'}</div>
    </>
);

export default ActionDetails;