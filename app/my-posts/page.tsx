"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Button,
  Avatar,
  TextField,
  InputAdornment,
  Breadcrumbs,
  Chip,
  Paper,
  Divider,
  CircularProgress,
  Stack,
} from "@mui/material";
import {
  Search as SearchIcon,
  NavigateNext as NavigateNextIcon,
  AddCircleOutline as AddCircleOutlineIcon,
  Visibility as VisibilityIcon,
  LocationOn as LocationIcon,
} from "@mui/icons-material";
import api from "../services/api";
import { useAuthStore } from "../store/useAuthStore";
import Footer from "@/components/Footer";

// --- Interfaces Cập Nhật Theo API ---
interface Location {
  provinceName: string;
  wardName: string;
  fullAddress: string;
}

interface Post {
  _id: string;
  title: string;
  slug: string;
  price: number;
  images: string[];
  location: Location;
  status: string;
  views: number;
  createdAt: string;
}

export default function MyPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    { id: "active", label: "ĐANG HIỂN THỊ", key: "active" },
    { id: "hidden", label: "BỊ ẨN", key: "hidden" },
    { id: "rejected", label: "BỊ TỪ CHỐI", key: "rejected" },
    // { id: "pending_payment", label: "CẦN THANH TOÁN", key: "pending_payment" },
    // { id: "draft", label: "TIN NHÁP", key: "draft" },
    { id: "pending", label: "CHỜ DUYỆT", key: "pending" },
    { id: "all", label: "TẤT CẢ", key: "all" },
  ];

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  const currentUser = useAuthStore((state) => state.user);
  useEffect(() => {
    const fetchMyPosts = async () => {
      setIsLoading(true);
      try {
        // Lọc tin theo status dựa trên tab đang chọn
        const currentStatus = tabs[activeTab].key;
        const res = await api.get(
          `/posts/me${currentStatus !== "all" ? `?status=${currentStatus}` : ""}`,
        );
        if (res.data.success) {
          setPosts(res.data.data);
        }
      } catch (error) {
        console.error("Lỗi khi lấy danh sách tin:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMyPosts();
  }, [activeTab]);

  // Hàm format tiền tệ
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  return (
    <div>
      <Box sx={{ bgcolor: "#f4f4f4", minHeight: "100vh", pb: 10 }}>
        <Container maxWidth="md" sx={{ pt: 2 }}>
          {/* Profile Card */}
          <Paper
            elevation={0}
            sx={{
              borderBottom: "1px solid #f0f0f0",
              p: 2,
              borderRadius: "8px 8px 0 0",
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar
                  src={currentUser?.avatar || "/cat-avatar.jpg"}
                  sx={{ width: 56, height: 56, border: "1px solid #eee" }}
                />
                <Box>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: "bold", lineHeight: 1.2 }}
                  >
                    {currentUser?.name || "Người dùng"}
                  </Typography>
                </Box>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  bgcolor: "#fff9e6",
                  px: 2,
                  py: 0.8,
                  borderRadius: 2,
                  border: "1px solid #ffecb3",
                }}
              ></Box>
            </Box>
          </Paper>

          <Paper
            elevation={0}
            sx={{ borderRadius: 0, borderBottom: "1px solid #eee" }}
          >
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                "& .MuiTab-root": {
                  fontWeight: "bold",
                  fontSize: 13,
                  minWidth: "auto",
                  px: 3,
                  py: 2,
                  color: "gray",
                },
                "& .Mui-selected": { color: "black !important" },
                "& .MuiTabs-indicator": { bgcolor: "#ff8800", height: 4 },
              }}
            >
              {tabs.map((tab) => (
                <Tab key={tab.id} label={tab.label} />
              ))}
            </Tabs>
          </Paper>

          {/* Content Area */}
          <Paper
            elevation={0}
            sx={{ minHeight: 400, borderRadius: "0 0 8px 8px" }}
          >
            {isLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
                <CircularProgress sx={{ color: "#ff8800" }} />
              </Box>
            ) : posts.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 10, px: 2 }}>
                {/* <Box
                component="img"
                src="https://static.chotot.com/storage/default/ufo_empty.png"
                sx={{ width: 240, mb: 3 }}
              /> */}
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                  Không tìm thấy tin đăng
                </Typography>
                <Button
                  component={Link}
                  href="/post"
                  variant="contained"
                  sx={{
                    mt: 4,
                    bgcolor: "#ff8800",
                    "&:hover": { bgcolor: "#e67a00" },
                    px: 5,
                    py: 1.2,
                    fontWeight: "bold",
                    borderRadius: 2,
                  }}
                >
                  Đăng tin ngay
                </Button>
              </Box>
            ) : (
              <Box>
                {posts.map((post) => (
                  <Box key={post._id}>
                    <Box sx={{ p: 2, display: "flex", gap: 2 }}>
                      {/* Hình ảnh sản phẩm */}
                      <Box
                        component="img"
                        src={
                          post.images[0] || "https://via.placeholder.com/100"
                        }
                        sx={{
                          width: 100,
                          height: 100,
                          borderRadius: 1,
                          objectFit: "cover",
                          bgcolor: "#eee",
                        }}
                      />

                      {/* Thông tin sản phẩm */}
                      <Stack spacing={0.5} sx={{ flex: 1 }}>
                        <Typography
                          variant="subtitle1"
                          sx={{
                            fontWeight: "bold",
                            lineHeight: 1.3,
                            color: "#222",
                          }}
                        >
                          {post.title}
                        </Typography>
                        <Typography
                          sx={{
                            color: "#d0021b",
                            fontWeight: "bold",
                            fontSize: 15,
                          }}
                        >
                          {formatPrice(post.price)}
                        </Typography>

                        <Stack
                          direction="row"
                          spacing={2}
                          alignItems="center"
                          sx={{ color: "text.secondary" }}
                        >
                          {/* <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                            }}
                          >
                            <VisibilityIcon sx={{ fontSize: 14 }} />
                            <Typography variant="caption">
                              Lượt xem: {post.views}
                            </Typography>
                          </Box> */}
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                            }}
                          >
                            <LocationIcon sx={{ fontSize: 14 }} />
                            <Typography variant="caption" noWrap>
                              {post.location.provinceName}
                            </Typography>
                          </Box>
                        </Stack>
                      </Stack>

                      {/* Nút thao tác nhanh */}
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                        }}
                      >
                        <Button
                          variant="outlined"
                          size="small"
                          sx={{
                            textTransform: "none",
                            color: "#1976d2",
                            borderColor: "#1976d2",
                            fontWeight: "bold",
                          }}
                        >
                          <Link href={`/post/edit/${post._id}`}>Chỉnh sửa</Link>
                        </Button>
                      </Box>
                    </Box>
                    <Divider sx={{ mx: 2 }} />
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
        </Container>
      </Box>
      <Footer />
    </div>
  );
}
