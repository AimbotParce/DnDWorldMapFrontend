interface ToggleableButtonProps extends React.BaseHTMLAttributes<HTMLButtonElement> {
    selected: boolean
}

function ToggleableButton(props: ToggleableButtonProps) {
    const { selected: selected, children: children, onClick: onClick, className: className, ...otherProps } = props

    const baseClassName = `${className} border px-4 py-1 rounded-full shadow-lg font-bold text-sm hover:shadow-md`
    return (
        <button
            onClick={onClick}
            className={
                selected
                    ? `${baseClassName} bg-blue-500 border-blue-500 text-white hover:text-white cursor-default`
                    : `${baseClassName} bg-white border-white hover:border-blue-500 hover:text-blue cursor:pointer`
            }
            {...otherProps}
        >
            {children}
        </button>
    )
}

export default ToggleableButton
