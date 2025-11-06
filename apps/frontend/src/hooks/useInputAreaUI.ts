import React, { useState, useRef, useEffect, useMemo } from "react";
import { useAnimatedPlaceholder } from "./useAnimatedPlaceholder";
import { useTranslation } from "../contexts/TranslationContext";

const detectLanguage = (text: string): "ltr" | "rtl" => {
    if (!text) return "ltr";

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

    const examples = React.useMemo(() => {
        try {
            const currentTranslations = (translationContext as any).translations?.[
                translationContext.currentLang
            ];
            const examples = currentTranslations?.input?.examples;

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
            return [
                "What can you help me with?",
                "Explain quantum computing simply",
                "Write a creative short story",
            ];
        }
    }, [translationContext.currentLang, translationContext.translations]);

    const animatedPlaceholder = useAnimatedPlaceholder({
        examples,
        typingSpeed: 150,
        pauseDuration: 1500,
        deletingSpeed: 75,
        isActive: !value.trim() && examples.length > 0,
    });

    const debugPlaceholder = animatedPlaceholder ?? "";

    const onHeightChangeRef = useRef(onHeightChange);

    useEffect(() => {
        onHeightChangeRef.current = onHeightChange;
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;

            if (inputContainerRef.current && onHeightChangeRef.current) {
                const height = inputContainerRef.current.offsetHeight;
                onHeightChangeRef.current(height);
            }
        }
    }, [value]);

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

    useEffect(() => {
        if (textareaRef.current && !disabled) {
            textareaRef.current.focus();
        }
    }, [disabled]);

    const shouldShowSettingsIcon = useMemo(() => {
        const enabledToolsWithConfig = toolSchemas.filter(
            (tool) =>
                enabledTools[tool.id] &&
                tool.requiresConfiguration &&
                Object.keys(tool.configurationFields || {}).length > 0
        );

        return enabledToolsWithConfig.length > 0;
    }, [enabledTools, toolSchemas]);

    const textDirection = useMemo(
        () => detectLanguage(value || ""),
        [value]
    );

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
