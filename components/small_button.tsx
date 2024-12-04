import React from "react"

export default function SmallButton(props: React.BaseHTMLAttributes<HTMLButtonElement>) {
    const { children: children, className: className, ...otherProps } = props
    return (
        <button
            className={`${className} border border-white px-4 py-1 rounded-full shadow-lg bg-white font-bold hover:shadow-blue-200 hover:shadow-md hover:text-blue-500 hover:border hover:border-blue-500`}
            {...otherProps}
        >
            {children}
        </button>
    )
}
