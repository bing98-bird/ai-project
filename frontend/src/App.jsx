import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Container,
  TextField,
  IconButton,
  Typography,
  Paper,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  AppBar,
  Toolbar,
  Button,
  Avatar,
  CircularProgress,
  Chip,
  Alert,
  Snackbar,
  Tooltip,
} from "@mui/material";
import {
  Send as SendIcon,
  CloudUpload as UploadIcon,
  Description as DocIcon,
  Chat as ChatIcon,
  History as HistoryIcon,
  Menu as MenuIcon,
  Brightness4 as DarkIcon,
  Brightness7 as LightIcon,
  Delete as DeleteIcon,
  AnalyticsOutlined as AnalyticsIcon,
  Download as DownloadIcon,
  CleaningServices as CleanDataIcon,
  FileDownload as PdfDownloadIcon,
} from "@mui/icons-material";
import axios from "axios";
import { useMutation } from "@tanstack/react-query";
import { ThemeProvider, CssBaseline } from "@mui/material";
import getTheme from "./theme";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { jsPDF } from "jspdf";

const App = () => {
  const [mode, setMode] = useState("dark");
  const theme = getTheme(mode);

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hello! I am your Project Intelligence Assistant. Upload your project documents to get started.",
      citations: [],
    },
  ]);
  const [input, setInput] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadError, setUploadError] = useState(null);
  const [analyzingFile, setAnalyzingFile] = useState(null);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  // Function to download report as PDF
  const downloadReportAsPdf = async (message, index) => {
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const maxWidth = pageWidth - 2 * margin;
      let yPosition = margin;

      // Set title
      doc.setFontSize(16);
      doc.setFont(undefined, "bold");
      const titleLines = doc.splitTextToSize(
        "Project Intelligence Hub - Analysis Report",
        maxWidth
      );
      titleLines.forEach((line) => {
        doc.text(line, margin, yPosition);
        yPosition += 7;
      });

      yPosition += 5;

      // Split content by markdown headings and format accordingly
      const lines = message.content.split("\n");
      doc.setFontSize(11);
      doc.setFont(undefined, "normal");

      for (const line of lines) {
        // Check if we need a new page
        if (yPosition > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }

        if (line.startsWith("##")) {
          // Section heading
          doc.setFontSize(13);
          doc.setFont(undefined, "bold");
          const heading = line.replace(/^#+\s*/, "");
          const headingLines = doc.splitTextToSize(heading, maxWidth);
          headingLines.forEach((headingLine) => {
            doc.text(headingLine, margin, yPosition);
            yPosition += 6;
          });
          doc.setFontSize(11);
          doc.setFont(undefined, "normal");
          yPosition += 2;
        } else if (line.startsWith("#")) {
          // Main heading
          doc.setFontSize(14);
          doc.setFont(undefined, "bold");
          const heading = line.replace(/^#+\s*/, "");
          const headingLines = doc.splitTextToSize(heading, maxWidth);
          headingLines.forEach((headingLine) => {
            doc.text(headingLine, margin, yPosition);
            yPosition += 7;
          });
          doc.setFontSize(11);
          doc.setFont(undefined, "normal");
          yPosition += 3;
        } else if (line.startsWith("•") || line.startsWith("-")) {
          // Bullet point
          const bulletText = line.replace(/^[•-]\s*/, "");
          const bulletLines = doc.splitTextToSize(bulletText, maxWidth - 5);
          doc.text("•", margin, yPosition);
          bulletLines.forEach((bulletLine, idx) => {
            doc.text(bulletLine, margin + 5, yPosition);
            yPosition += 5;
          });
          yPosition += 1;
        } else if (line.trim() !== "") {
          // Regular text
          const textLines = doc.splitTextToSize(line, maxWidth);
          textLines.forEach((textLine) => {
            doc.text(textLine, margin, yPosition);
            yPosition += 5;
          });
        } else {
          // Empty line
          yPosition += 3;
        }
      }

      // Add footer with timestamp
      doc.setFontSize(9);
      doc.setFont(undefined, "italic");
      doc.setTextColor(128, 128, 128);
      const timestamp = new Date().toLocaleString();
      doc.text(
        `Generated on ${timestamp}`,
        margin,
        pageHeight - 10
      );

      // Save PDF
      const filename = `Analysis_Report_${new Date().getTime()}.pdf`;
      doc.save(filename);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  const queryMutation = useMutation({
    mutationFn: async (userQuery) => {
      const { data } = await axios.post("http://localhost:8000/api/query", {
        query: userQuery,
        session_id: "default_session_123",
      });
      return data;
    },
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.answer, citations: data.citations },
      ]);
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Error connecting to the AI brain. Please ensure the backend is running.",
          citations: [],
        },
      ]);
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (file) => {
      setUploadError(null);
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await axios.post(
        "http://localhost:8000/api/ingest",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      return data;
    },
    onSuccess: (data) => {
      setUploadedFiles((prev) => [...new Set([...prev, data.filename])]);
    },
    onError: (error) => {
      setUploadError(
        error.response?.data?.detail ||
          "Failed to upload document. Please check the file and try again.",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (filename) => {
      await axios.delete(`http://localhost:8000/api/delete/${filename}`);
      return filename;
    },
    onSuccess: (filename) => {
      setUploadedFiles((prev) => prev.filter((f) => f !== filename));
    },
    onError: () => {
      setUploadError("Failed to delete document. Please try again.");
    },
  });

  const analyzeMutation = useMutation({
    mutationFn: async (filename) => {
      setAnalyzingFile(filename);
      const { data } = await axios.post(
        `http://localhost:8000/api/analyze/${filename}`
      );
      return data;
    },
    onSuccess: (data) => {
      if (data.status === "success") {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `📊 **Data Analysis Report: ${data.file_name}**\n\n${data.insights}`,
            citations: [],
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `❌ Analysis failed: ${data.message}`,
            citations: [],
          },
        ]);
      }
      setAnalyzingFile(null);
    },
    onError: (error) => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `❌ Error analyzing file: ${error.message}`,
          citations: [],
        },
      ]);
      setAnalyzingFile(null);
    },
  });

  const cleanMutation = useMutation({
    mutationFn: async (filename) => {
      setAnalyzingFile(filename);
      const { data } = await axios.post(
        `http://localhost:8000/api/clean/${filename}`
      );
      return data;
    },
    onSuccess: (data) => {
      if (data.status === "success") {
        // Add cleaned file to uploaded files list
        const cleanedFile = data.cleaned_file;
        setUploadedFiles((prev) => {
          // Check if cleaned file is already in list
          if (!prev.includes(cleanedFile)) {
            return [...prev, cleanedFile];
          }
          return prev;
        });

        const cleanedMsg = `🧹 **DATA CLEANING REPORT**\n\n${data.report}\n\n**BUSINESS INSIGHTS:**\n${data.business_insights}\n\n✅ **Cleaned file:** ${data.cleaned_file}\n\nYou can download it using the download button.`;
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: cleanedMsg,
            citations: [],
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `❌ Data cleaning failed: ${data.message}`,
            citations: [],
          },
        ]);
      }
      setAnalyzingFile(null);
    },
    onError: (error) => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `❌ Error cleaning data: ${error.message}`,
          citations: [],
        },
      ]);
      setAnalyzingFile(null);
    },
  });

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      uploadMutation.mutate(file);
    }
  };

  const handleSend = () => {
    if (!input.trim() || queryMutation.isPending) return;

    const userMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    queryMutation.mutate(input);
    setInput("");
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          display: "flex",
          height: "100vh",
          bgcolor: "background.default",
          color: "text.primary",
        }}
      >
        {/* Sidebar for Documents */}
        <Drawer
          variant="permanent"
          sx={{
            width: 280,
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              width: 280,
              boxSizing: "border-box",
              bgcolor: "background.paper",
              borderRight: "1px solid rgba(255, 255, 255, 0.05)",
            },
          }}
        >
          <Toolbar>
            <Typography
              variant="h6"
              sx={{ fontWeight: 800, color: "primary.main", letterSpacing: 1 }}
            >
              GAMUDA AI
            </Typography>
          </Toolbar>
          <Divider sx={{ opacity: 0.1 }} />
          <Box sx={{ p: 2 }}>
            <Button
              fullWidth
              variant="contained"
              startIcon={
                uploadMutation.isPending ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <UploadIcon />
                )
              }
              onClick={() => fileInputRef.current.click()}
              disabled={uploadMutation.isPending}
              sx={{
                py: 1.5,
                background: "linear-gradient(45deg, #3EB489 30%, #2E8565 90%)",
                boxShadow: "0 3px 15px rgba(62, 180, 137, 0.3)",
              }}
            >
              {uploadMutation.isPending ? "Uploading..." : "Upload Document"}
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: "none" }}
              accept=".pdf,.xlsx,.csv"
            />
            {uploadError && (
              <Alert
                severity="error"
                sx={{ mt: 2, fontSize: "0.75rem" }}
                onClose={() => setUploadError(null)}
              >
                {uploadError}
              </Alert>
            )}
          </Box>
          <List>
            <ListItem disablePadding>
              <Typography
                variant="overline"
                sx={{ px: 3, py: 1, opacity: 0.5 }}
              >
                ACTIVE DOCUMENTS
              </Typography>
            </ListItem>
            {uploadedFiles.map((doc) => (
              <ListItem
                key={doc}
                sx={{ 
                  px: 2, 
                  py: 2,
                  flexDirection: "column",
                  alignItems: "flex-start",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                  gap: 1
                }}
              >
                <Box sx={{ display: "flex", alignItems: "flex-start", width: "100%", gap: 1, minWidth: 0 }}>
                  <ListItemIcon sx={{ minWidth: "auto" }}>
                    <DocIcon fontSize="small" sx={{ color: "primary.main", mt: 0.5 }} />
                  </ListItemIcon>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      sx={{ 
                        fontSize: "0.85rem",
                        wordBreak: "break-all",
                        lineHeight: 1.4,
                        color: "rgba(255, 255, 255, 0.9)",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden"
                      }}
                    >
                      {doc}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ 
                  display: "flex", 
                  gap: 0.5,
                  marginLeft: "32px"
                }}>
                  <IconButton
                    edge="end"
                    aria-label="download"
                    size="small"
                    onClick={() => {
                      const link = document.createElement("a");
                      link.href = `http://localhost:8000/api/download/${encodeURIComponent(doc)}`;
                      link.download = doc;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    sx={{
                      color: "rgba(255, 255, 255, 0.3)",
                      "&:hover": { color: "info.main" },
                    }}
                    title="Download file"
                  >
                    <DownloadIcon fontSize="inherit" />
                  </IconButton>
                  {(doc.endsWith(".csv") || doc.endsWith(".xlsx") || doc.endsWith(".xls") || doc.endsWith(".pdf")) && (
                    <IconButton
                      edge="end"
                      aria-label="analyze"
                      size="small"
                      onClick={() => analyzeMutation.mutate(doc)}
                      disabled={analyzeMutation.isPending || analyzingFile === doc}
                      sx={{
                        color: "rgba(255, 255, 255, 0.3)",
                        "&:hover": { color: "success.main" },
                      }}
                      title="Analyze this file"
                    >
                      {analyzeMutation.isPending && analyzingFile === doc ? (
                        <CircularProgress size={16} color="inherit" />
                      ) : (
                        <AnalyticsIcon fontSize="inherit" />
                      )}
                    </IconButton>
                  )}
                  {(doc.endsWith(".csv") || doc.endsWith(".xlsx") || doc.endsWith(".xls")) && (
                    <IconButton
                      edge="end"
                      aria-label="clean"
                      size="small"
                      onClick={() => cleanMutation.mutate(doc)}
                      disabled={cleanMutation.isPending || analyzingFile === doc}
                      sx={{
                        color: "rgba(255, 255, 255, 0.3)",
                        "&:hover": { color: "warning.main" },
                      }}
                      title="Clean and standardize data"
                    >
                      {cleanMutation.isPending && analyzingFile === doc ? (
                        <CircularProgress size={16} color="inherit" />
                      ) : (
                        <CleanDataIcon fontSize="inherit" />
                      )}
                    </IconButton>
                  )}
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    size="small"
                    onClick={() => deleteMutation.mutate(doc)}
                    disabled={deleteMutation.isPending}
                    sx={{
                      color: "rgba(255, 255, 255, 0.3)",
                      "&:hover": { color: "error.main" },
                    }}
                  >
                    {deleteMutation.isPending &&
                    deleteMutation.variables === doc ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <DeleteIcon fontSize="inherit" />
                    )}
                  </IconButton>
                </Box>
              </ListItem>
            ))}
          </List>
        </Drawer>

        {/* Main Chat Area */}
        <Box
          sx={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            position: "relative",
          }}
        >
          <AppBar
            position="static"
            elevation={0}
            sx={{
              bgcolor: "transparent",
              borderBottom: "1px solid",
              borderColor: "divider",
            }}
          >
            <Toolbar>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Project intelligence Hub
              </Typography>
              <Box sx={{ flexGrow: 1 }} />
              <Chip
                label="Gemini 2.5 Flash Optimized"
                color="primary"
                variant="outlined"
                size="small"
                sx={{ mr: 2 }}
              />
              <IconButton
                onClick={() => setMode(mode === "dark" ? "light" : "dark")}
                color="inherit"
              >
                {mode === "dark" ? (
                  <LightIcon sx={{ color: "primary.main" }} />
                ) : (
                  <DarkIcon />
                )}
              </IconButton>
            </Toolbar>
          </AppBar>

          <Box
            ref={scrollRef}
            sx={{
              flexGrow: 1,
              p: 4,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 3,
            }}
          >
            {messages.map((msg, idx) => (
              <Box
                key={idx}
                sx={{
                  display: "flex",
                  flexDirection: msg.role === "user" ? "row-reverse" : "row",
                  gap: 2,
                  maxWidth: "85%",
                  alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <Avatar
                  sx={{
                    bgcolor:
                      msg.role === "user" ? "secondary.main" : "primary.main",
                    width: 48,
                    height: 48,
                  }}
                >
                  {msg.role === "user" ? "U" : "G"}
                </Avatar>
                <Box>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor:
                        msg.role === "user"
                          ? "secondary.dark"
                          : "background.paper",
                      border: "1px solid rgba(255, 255, 255, 0.05)",
                      boxShadow:
                        msg.role === "user"
                          ? "none"
                          : "0 4px 20px rgba(0,0,0,0.2)",
                    }}
                  >
                    <Typography
                      variant="body1"
                      sx={{
                        lineHeight: 1.6,
                        "& p": { margin: 0 },
                        "& ul, & ol": { mt: 1, mb: 1, pl: 2 },
                        "& code": {
                          bgcolor: "rgba(255,255,255,0.05)",
                          p: 0.5,
                          borderRadius: 1,
                        },
                      }}
                      component="div"
                    >
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                    </Typography>
                  </Paper>
                  {msg.citations?.length > 0 && (
                    <Box
                      sx={{ mt: 1, display: "flex", gap: 1, flexWrap: "wrap" }}
                    >
                      {msg.citations.map((cite, cIdx) => (
                        <Chip
                          key={cIdx}
                          size="small"
                          label={
                            cite.location_type && cite.location
                              ? `${cite.file_name} (${cite.location_type} ${cite.location})`
                              : `${cite.file_name} (p. ${cite.page_number})`
                          }
                          sx={{
                            fontSize: "0.65rem",
                            bgcolor: "rgba(62, 180, 137, 0.1)",
                            color: "primary.main",
                          }}
                        />
                      ))}
                    </Box>
                  )}
                  {msg.role === "assistant" && (msg.content.includes("REPORT") || msg.content.includes("ANALYSIS") || msg.content.includes("INSIGHTS")) && (
                    <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
                      <Tooltip title="Download as PDF">
                        <Button
                          size="small"
                          startIcon={<PdfDownloadIcon />}
                          onClick={() => downloadReportAsPdf(msg, idx)}
                          sx={{
                            textTransform: "none",
                            bgcolor: "rgba(62, 180, 137, 0.1)",
                            color: "primary.main",
                            "&:hover": {
                              bgcolor: "rgba(62, 180, 137, 0.2)",
                            },
                          }}
                        >
                          Download PDF
                        </Button>
                      </Tooltip>
                    </Box>
                  )}
                </Box>
              </Box>
            ))}
            {queryMutation.isPending && (
              <Box sx={{ display: "flex", gap: 2 }}>
                <Avatar sx={{ bgcolor: "primary.main", width: 48, height: 48 }}>
                  G
                </Avatar>
                <CircularProgress size={20} sx={{ mt: 1 }} />
              </Box>
            )}
          </Box>

          {/* Input Bar */}
          <Box sx={{ p: 4, bgcolor: "background.default" }}>
            <Paper
              elevation={24}
              sx={{
                p: "4px 12px",
                display: "flex",
                alignItems: "center",
                borderRadius: 1.5,
                bgcolor: "background.paper",
                border: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              <TextField
                fullWidth
                placeholder="Ask about project risks, status, or budgets..."
                variant="standard"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSend()}
                InputProps={{ disableUnderline: true, sx: { px: 2, py: 1.5 } }}
              />
              <IconButton
                disabled={queryMutation.isPending}
                onClick={handleSend}
                sx={{
                  color: "primary.main",
                  "&:hover": { bgcolor: "rgba(62, 180, 137, 0.1)" },
                }}
              >
                <SendIcon />
              </IconButton>
            </Paper>
            <Typography
              variant="caption"
              sx={{
                mt: 1,
                display: "block",
                textAlign: "center",
                opacity: 0.3,
              }}
            >
              AI Assistant powered by Gemini 2.5 Flash for Gamuda Berhad
            </Typography>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default App;
