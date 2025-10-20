import { useState } from "react";
import {
  Box,
  TextField,
  Switch,
  FormControlLabel,
  IconButton,
  Button,
  Typography,
  Paper,
  Chip,
  Menu,
  MenuItem,
} from "@mui/material";
import {
  Settings as SettingsIcon,
  CalendarMonth as CalendarIcon,
} from "@mui/icons-material";
import { useTranslation } from "../contexts/TranslationContext";

interface AdvancedSearchInterfaceProps {
  isDarkMode: boolean;
  onSearch?: (query: string, filters: any) => void;
}

export function AdvancedSearchInterface({
  isDarkMode,
  onSearch,
}: AdvancedSearchInterfaceProps) {
  const { changeLanguage, currentLang } = useTranslation();

  // State management
  const [searchQuery, setSearchQuery] = useState("");
  const [filterText, setFilterText] = useState("סיון דפי טריביקוק");
  const [excludeAmi, setExcludeAmi] = useState(false);
  const [includeAmi, setIncludeAmi] = useState(false);
  const [selectedDays, setSelectedDays] = useState(7);
  const [selectedMode, setSelectedMode] = useState<"free" | "flow" | "product">(
    "free"
  );

  // Menu states
  const [languageMenuAnchor, setLanguageMenuAnchor] =
    useState<null | HTMLElement>(null);
  const [dateMenuAnchor, setDateMenuAnchor] = useState<null | HTMLElement>(
    null
  );

  const languages = [
    { code: "he", flag: "🇮🇱", name: "עברית" },
    { code: "ar", flag: "🇸🇦", name: "العربية" },
    { code: "en", flag: "🇺🇸", name: "English" },
  ];

  const dateOptions = [
    { value: 1, label: "יום אחד אחורה" },
    { value: 3, label: "3 ימים אחורה" },
    { value: 7, label: "7 ימים אחורה" },
    { value: 14, label: "14 ימים אחורה" },
    { value: 30, label: "חודש אחורה" },
  ];

  const handleSearch = () => {
    const filters = {
      filterText,
      excludeAmi,
      includeAmi,
      selectedDays,
      selectedMode,
    };
    onSearch?.(searchQuery, filters);
  };

  const handleLanguageChange = (langCode: string) => {
    changeLanguage(langCode);
    setLanguageMenuAnchor(null);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 3,
        padding: 3,
        maxWidth: 1200,
        margin: "0 auto",
        direction: "rtl", // RTL for Hebrew interface
      }}
    >
      {/* Top Section - Additional Settings */}
      <Paper
        elevation={2}
        sx={{
          padding: 3,
          borderRadius: 3,
          backgroundColor: isDarkMode ? "#2d2d2d" : "#ffffff",
          border: `2px solid ${isDarkMode ? "#404040" : "#e0e0e0"}`,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            marginBottom: 2,
            fontWeight: 600,
            color: isDarkMode ? "#ffffff" : "#333333",
            textAlign: "center",
          }}
        >
          הדרות נוספות
        </Typography>

        {/* Filter Input */}
        <TextField
          fullWidth
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          variant="outlined"
          sx={{
            marginBottom: 2,
            "& .MuiOutlinedInput-root": {
              borderRadius: 3,
              backgroundColor: isDarkMode ? "#404040" : "#f8f9fa",
            },
          }}
          InputProps={{
            style: { direction: "rtl" },
          }}
        />

        {/* Toggle Options */}
        <Box sx={{ display: "flex", gap: 3, justifyContent: "center" }}>
          <FormControlLabel
            control={
              <Switch
                checked={excludeAmi}
                onChange={(e) => setExcludeAmi(e.target.checked)}
                sx={{
                  "& .MuiSwitch-switchBase.Mui-checked": {
                    color: "#1976d2",
                  },
                  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                    backgroundColor: "#1976d2",
                  },
                }}
              />
            }
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Chip
                  label="כן"
                  size="small"
                  color={excludeAmi ? "primary" : "default"}
                  sx={{ minWidth: 40 }}
                />
                <Chip
                  label="לא"
                  size="small"
                  color={!excludeAmi ? "default" : "default"}
                  sx={{ minWidth: 40 }}
                />
                <Typography>האם להוציא תוצרי אמ"י?</Typography>
              </Box>
            }
            sx={{ margin: 0 }}
          />

          <FormControlLabel
            control={
              <Switch
                checked={includeAmi}
                onChange={(e) => setIncludeAmi(e.target.checked)}
                sx={{
                  "& .MuiSwitch-switchBase.Mui-checked": {
                    color: "#1976d2",
                  },
                  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                    backgroundColor: "#1976d2",
                  },
                }}
              />
            }
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Chip
                  label="כן"
                  size="small"
                  color={includeAmi ? "primary" : "default"}
                  sx={{ minWidth: 40 }}
                />
                <Chip
                  label="לא"
                  size="small"
                  color={!includeAmi ? "default" : "default"}
                  sx={{ minWidth: 40 }}
                />
                <Typography>האם להכיל רק תוצרי אמ"י?</Typography>
              </Box>
            }
            sx={{ margin: 0 }}
          />
        </Box>
      </Paper>

      {/* Bottom Section - Main Search Interface */}
      <Paper
        elevation={3}
        sx={{
          padding: 2,
          borderRadius: 4,
          backgroundColor: isDarkMode ? "#2d2d2d" : "#ffffff",
          border: `2px solid ${isDarkMode ? "#404040" : "#e0e0e0"}`,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            position: "relative",
          }}
        >
          {/* Language Flags */}
          <Box sx={{ display: "flex", gap: 1 }}>
            {languages.map((lang) => (
              <IconButton
                key={lang.code}
                onClick={(e) => setLanguageMenuAnchor(e.currentTarget)}
                sx={{
                  fontSize: "24px",
                  padding: 0.5,
                  opacity: currentLang === lang.code ? 1 : 0.6,
                  "&:hover": { opacity: 1 },
                }}
              >
                {lang.flag}
              </IconButton>
            ))}
          </Box>

          {/* Date Selector */}
          <IconButton
            onClick={(e) => setDateMenuAnchor(e.currentTarget)}
            sx={{
              backgroundColor: isDarkMode ? "#404040" : "#f0f0f0",
              borderRadius: 2,
              padding: 1,
              "&:hover": {
                backgroundColor: isDarkMode ? "#505050" : "#e0e0e0",
              },
            }}
          >
            <CalendarIcon />
            <Typography sx={{ marginInlineStart: 1, fontSize: "14px" }}>
              {selectedDays} ימים אחורה
            </Typography>
          </IconButton>

          {/* Settings */}
          <IconButton
            sx={{
              backgroundColor: isDarkMode ? "#404040" : "#f0f0f0",
              borderRadius: 2,
              "&:hover": {
                backgroundColor: isDarkMode ? "#505050" : "#e0e0e0",
              },
            }}
          >
            <SettingsIcon />
          </IconButton>

          {/* Main Search Input */}
          <TextField
            fullWidth
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ask anything..."
            variant="outlined"
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 4,
                backgroundColor: isDarkMode ? "#404040" : "#f8f9fa",
                fontSize: "18px",
                padding: "8px 16px",
              },
              "& .MuiOutlinedInput-input": {
                padding: "12px 0",
              },
            }}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
          />

          {/* Mode Buttons */}
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant={selectedMode === "free" ? "contained" : "outlined"}
              onClick={() => setSelectedMode("free")}
              sx={{
                borderRadius: 3,
                minWidth: 80,
                textTransform: "none",
                fontWeight: 600,
              }}
            >
              חינם
            </Button>
            <Button
              variant={selectedMode === "flow" ? "contained" : "outlined"}
              onClick={() => setSelectedMode("flow")}
              sx={{
                borderRadius: 3,
                minWidth: 80,
                textTransform: "none",
                fontWeight: 600,
                backgroundColor:
                  selectedMode === "flow" ? "#00bcd4" : "transparent",
                color: selectedMode === "flow" ? "white" : "#00bcd4",
                borderColor: "#00bcd4",
                "&:hover": {
                  backgroundColor:
                    selectedMode === "flow"
                      ? "#00acc1"
                      : "rgba(0, 188, 212, 0.1)",
                },
              }}
            >
              flow
            </Button>
            <Button
              variant={selectedMode === "product" ? "contained" : "outlined"}
              onClick={() => setSelectedMode("product")}
              sx={{
                borderRadius: 3,
                minWidth: 80,
                textTransform: "none",
                fontWeight: 600,
                backgroundColor:
                  selectedMode === "product" ? "#2196f3" : "transparent",
                color: selectedMode === "product" ? "white" : "#2196f3",
                borderColor: "#2196f3",
                "&:hover": {
                  backgroundColor:
                    selectedMode === "product"
                      ? "#1976d2"
                      : "rgba(33, 150, 243, 0.1)",
                },
              }}
            >
              תוצר
            </Button>
          </Box>
        </Box>

        {/* Language Menu */}
        <Menu
          anchorEl={languageMenuAnchor}
          open={Boolean(languageMenuAnchor)}
          onClose={() => setLanguageMenuAnchor(null)}
        >
          {languages.map((lang) => (
            <MenuItem
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              selected={currentLang === lang.code}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <span>{lang.flag}</span>
                <span>{lang.name}</span>
              </Box>
            </MenuItem>
          ))}
        </Menu>

        {/* Date Menu */}
        <Menu
          anchorEl={dateMenuAnchor}
          open={Boolean(dateMenuAnchor)}
          onClose={() => setDateMenuAnchor(null)}
        >
          {dateOptions.map((option) => (
            <MenuItem
              key={option.value}
              onClick={() => {
                setSelectedDays(option.value);
                setDateMenuAnchor(null);
              }}
              selected={selectedDays === option.value}
            >
              {option.label}
            </MenuItem>
          ))}
        </Menu>
      </Paper>
    </Box>
  );
}
