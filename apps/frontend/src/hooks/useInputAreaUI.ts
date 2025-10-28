import React, { useState, useRef, useEffect, useMemo } from "react";
import { useAnimatedPlaceholder } from "./useAnimatedPlaceholder";
import { useTranslation } from "../contexts/TranslationContext";

// Helper function to detect text direction
const detectLanguage = (text: string): "ltr" | "rtl" => {
    if (!text) return "ltr";

    // Hebrew and Arabic character ranges
    const rtlRegex =
        /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

    return rtlRegex.test(text) ? "rtl" : "ltr";
};

interface UseInputAreaUIProps {
    value: string;
    isDarkMode: boolean;
    disabled: boolean;
    onHeightChange?: (height: number) => void;
    toolSchemas: any[];
    enabledTools: { [key: string]: boolean };
    needsToolConfiguration?: boolean;
}

export const useInputAreaUI = ({
    value,
    isDarkMode,
    disabled,
    onHeightChange,
    toolSchemas,
    enabledTools,
    needsToolConfiguration = false,
}: UseInputAreaUIProps) => {
    const [isFocused, setIsFocused] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const inputContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const translationContext = useTranslation();
    const { t } = translationContext;

    // Animated placeholder - get examples from translation
    const examples = React.useMemo(() => {
        try {
            // Access the current translations directly
            const currentTranslations = (translationContext as any).translations?.[
                translationContext.currentLang
            ];
            const examples = currentTranslations?.input?.examples;

            // If no examples from translations, use fallback for testing
            if (!examples || !Array.isArray(examples) || examples.length === 0) {
                return [
                    "What can you help me with?",
                    "Explain quantum computing simply",
                    "Write a creative short story",
                    "Help me debug this code",
                ];
            }

            return examples;
        } catch (error) {
            console.error("❌ Error loading examples:", error);
            // Return fallback examples if there's an error
            return [
                "What can you help me with?",
                "Explain quantum computing simply",
                "Write a creative short story",
            ];
        }
    }, [translationContext.currentLang, translationContext.translations]);

    // Animated placeholder with optimized hook to prevent infinite loops
    const animatedPlaceholder = useAnimatedPlaceholder({
        examples,
        typingSpeed: 150,
        pauseDuration: 1500,
        deletingSpeed: 75,
        isActive: !value.trim() && examples.length > 0,
    });

    // Show debug info in placeholder for testing
    const debugPlaceholder = animatedPlaceholder ?? "";

    // Stable callback for height measurement - use ref to avoid dependency issues
    const onHeightChangeRef = useRef(onHeightChange);
    onHeightChangeRef.current = onHeightChange;

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;

            // Measure height after resize
            if (inputContainerRef.current && onHeightChangeRef.current) {
                const height = inputContainerRef.current.offsetHeight;
                onHeightChangeRef.current(height);
            }
        }
    }, [value]);

    // Measure input area height on window resize
    useEffect(() => {
        const handleResize = () => {
            if (inputContainerRef.current && onHeightChangeRef.current) {
                const height = inputContainerRef.current.offsetHeight;
                onHeightChangeRef.current(height);
            }
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Focus textarea when not disabled
    useEffect(() => {
        if (textareaRef.current && !disabled) {
            textareaRef.current.focus();
        }
    }, [disabled]);

    // Check if we should show the settings icon
    const shouldShowSettingsIcon = useMemo(() => {
        // Hide if none of the enabled tools have configuration fields
        const enabledToolsWithConfig = toolSchemas.filter(
            (tool) =>
                enabledTools[tool.id] &&
                tool.requiresConfiguration &&
                Object.keys(tool.configurationFields || {}).length > 0
        );

        return enabledToolsWithConfig.length > 0;
    }, [enabledTools, toolSchemas]);

    // Detect text direction for proper alignment
    const textDirection = useMemo(
        () => detectLanguage(value || ""),
        [value]
    );

    // Memoize textarea styles to prevent unnecessary re-renders
    const textareaStyle = useMemo(
        () => ({
            width: "100%",
            minHeight: "52px",
            maxHeight: "200px",
            padding: "16px",
            border: "none",
            outline: "none",
            resize: "none" as const,
            backgroundColor: "transparent",
            color: isDarkMode ? "#ececf1" : "#374151",
            fontSize: "16px",
            fontFamily:
                'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            lineHeight: "1.5",
            overflow: "hidden" as const,
            fontWeight: "400",
            WebkitAppearance: "none" as const,
            cursor: "text" as const,
            direction: textDirection as "ltr" | "rtl",
            textAlign:
                textDirection === "rtl" ? ("right" as const) : ("left" as const),
            unicodeBidi: "plaintext" as const,
            boxSizing: "border-box" as const,
        }),
        [isDarkMode, textDirection]
    );

    return {
        isFocused,
        setIsFocused,
        textareaRef,
        inputContainerRef,
        fileInputRef,
        onHeightChangeRef,
        textDirection,
        textareaStyle,
        shouldShowSettingsIcon,
        debugPlaceholder,
        needsToolConfiguration,
    };
};
