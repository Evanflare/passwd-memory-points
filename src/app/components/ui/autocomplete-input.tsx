import React, {
    useState,
    useRef,
    useEffect,
    useCallback,
    memo,
} from "react";

interface AutocompleteInputProps {
    value: string;
    onChange: (value: string) => void;
    options: string[];
    placeholder?: string;
    onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    filterFn?: (query: string, option: string) => boolean;
    maxResults?: number;
    highlightClassName?: string;
    debounceMs?: number;
}

const AutocompleteInput = memo(function AutocompleteInput({
    value,
    onChange,
    options,
    placeholder,
    onKeyDown,
    filterFn = (query, option) =>
        option.toLowerCase().includes(query.toLowerCase()),
    maxResults = 50,
    highlightClassName = "bg-primary/20 font-semibold",
    debounceMs = 150,
}: AutocompleteInputProps) {
    const [inputValue, setInputValue] = useState(value);
    const [showDropdown, setShowDropdown] = useState(false);
    const [highlightIndex, setHighlightIndex] = useState(-1);
    const [preventAutoOpen, setPreventAutoOpen] = useState(false);
    const [filteredOptions, setFilteredOptions] = useState<string[]>([]);

    const inputRef = useRef<HTMLInputElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLUListElement>(null);
    const debounceTimerRef = useRef<any | null>(null);

    useEffect(() => {
        if (value !== inputValue) setInputValue(value);
    }, [value]);

    const performFilter = useCallback(
        (searchText: string) => {
            if (!searchText.trim()) {
                setFilteredOptions([]);
                setShowDropdown(false);
                return;
            }
            const results = options
                .filter((opt) => filterFn(searchText, opt))
                .slice(0, maxResults);
            setFilteredOptions(results);
            setShowDropdown(results.length > 0);
            setHighlightIndex(-1);
        },
        [options, filterFn, maxResults]
    );

    const debouncedFilter = useCallback(
        (searchText: string) => {
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = setTimeout(() => {
                performFilter(searchText);
            }, debounceMs);
        },
        [performFilter, debounceMs]
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setInputValue(newValue);
        onChange(newValue);
        setPreventAutoOpen(false);

        if (!newValue.trim()) {
            setFilteredOptions([]);
            setShowDropdown(false);
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        } else {
            debouncedFilter(newValue);
        }
    };

    const handleFocus = () => {
        if (preventAutoOpen) return;
        if (!inputValue.trim()) {
            setFilteredOptions(options.slice(0, maxResults));
            setShowDropdown(options.length > 0);
        } else {
            performFilter(inputValue);
        }
    };

    const handleSelect = (selected: string) => {
        setInputValue(selected);
        onChange(selected);
        setShowDropdown(false);
        setPreventAutoOpen(true);
        inputRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!showDropdown) {
            onKeyDown?.(e);
            return;
        }

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                setHighlightIndex((prev) => {
                    const next = prev + 1;
                    if (next >= filteredOptions.length) return prev;
                    setTimeout(() => {
                        const item = listRef.current?.children[next] as HTMLElement;
                        item?.scrollIntoView({ block: "nearest", behavior: "smooth" });
                    }, 0);
                    return next;
                });
                break;
            case "ArrowUp":
                e.preventDefault();
                setHighlightIndex((prev) => {
                    const next = prev - 1;
                    if (next < -1) return prev;
                    setTimeout(() => {
                        if (next >= 0) {
                            const item = listRef.current?.children[next] as HTMLElement;
                            item?.scrollIntoView({ block: "nearest", behavior: "smooth" });
                        }
                    }, 0);
                    return next;
                });
                break;
            case "Enter":
                e.preventDefault();
                if (highlightIndex >= 0 && filteredOptions[highlightIndex]) {
                    handleSelect(filteredOptions[highlightIndex]);
                } else if (filteredOptions.length > 0) {
                    handleSelect(filteredOptions[0]);
                } else {
                    onKeyDown?.(e);
                }
                break;
            case "Escape":
                setShowDropdown(false);
                break;
            case "Tab":
                // Tab 键：关闭下拉框，但不阻止默认行为（让焦点移动到下一个元素）
                setShowDropdown(false);
                // 注意：此处不调用 e.preventDefault()，也不调用 onKeyDown 以避免重复处理
                return;
            default:
                onKeyDown?.(e);
        }
    };

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const renderHighlighted = (text: string, query: string) => {
        if (!query.trim()) return text;
        const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(`(${escapeRegex(query)})`, "gi");
        const parts = text.split(regex);
        return parts.map((part, idx) =>
            regex.test(part) ? (
                <span key={idx} className={highlightClassName}>
                    {part}
                </span>
            ) : (
                <span key={idx}>{part}</span>
            )
        );
    };

    return (
        <div ref={wrapperRef} className="relative flex-1">
            <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={handleChange}
                onFocus={handleFocus}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                autoComplete="off"
                className="w-full px-3 py-2 rounded-lg bg-input-background text-foreground border border-border text-sm outline-none focus:border-primary transition-colors"
            />
            {showDropdown && filteredOptions.length > 0 && (
                <ul
                    ref={listRef}
                    className="absolute z-10 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-48 overflow-auto custom-scrollbar"
                >
                    {filteredOptions.map((opt, idx) => (
                        <li
                            key={opt}
                            onClick={() => handleSelect(opt)}
                            onMouseEnter={() => setHighlightIndex(idx)}
                            className={`px-3 py-2 text-sm cursor-pointer transition-colors ${idx === highlightIndex ? "bg-accent" : "hover:bg-accent/50"
                                }`}
                        >
                            {renderHighlighted(opt, inputValue)}
                        </li>
                    ))}
                </ul>
            )}
            {showDropdown && filteredOptions.length === 0 && inputValue.trim() !== "" && (
                <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-md shadow-lg px-3 py-2 text-sm text-muted-foreground">
                    未找到匹配项
                </div>
            )}
        </div>
    );
});

export default AutocompleteInput;