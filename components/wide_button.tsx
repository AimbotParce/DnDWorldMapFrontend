import React from "react"

export default function WideButton(props: React.BaseHTMLAttributes<HTMLButtonElement>) {
    const { children: children, className: className, ...otherProps } = props
    return (
        <button
            className={`${className} border border-white w-full px-4 py-2 rounded-full shadow-lg bg-white font-bold hover:shadow-blue-200 hover:shadow-md hover:text-blue-500 hover:border hover:border-blue-500`}
            {...otherProps}
        >
            {children}
        </button>
    )
}
