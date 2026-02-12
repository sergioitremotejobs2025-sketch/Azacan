"use client";
import React, { useActionState } from "react";
import { FiTrash2 } from "react-icons/fi";

type DeleteButtonProps = {
    action: (prevState: any, formData: FormData) => Promise<any>;
    id?: string;
    confirmMessage?: string;
}

const DeleteButton = ({ action, id, confirmMessage }: DeleteButtonProps) => {
    const [state, formAction] = useActionState(action, null);
    return (
        <form action={formAction} className="contents">
            <input type="hidden" name="id" value={id} />
            <button
                type="submit"
                className="p-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors group/delete"
                title="Remove item"
                onClick={(e) => {
                    if (!confirm(confirmMessage || "Are you sure you want to remove this item?")) {
                        e.preventDefault();
                    }
                }}>
                <FiTrash2 size={18} className="group-hover/delete:scale-110 transition-transform" />
            </button>
        </form>
    );
};

export default DeleteButton;