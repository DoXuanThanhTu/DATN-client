"use client";

import { useEffect, useState } from "react";
import api from "../services/api";

/**
 * =====================================
 * TYPES
 * =====================================
 */

type Mode = "content" | "collaborative" | "search" | "hybrid";

type User = {
  _id: string;
  name: string;
};

// Updated Item type to match backend response (includes score and debug directly)
type Item = {
  _id: string;
  title: string;
  price: number;
  images: string[];
  score: number;
  debug?: any;
  location?: {
    fullAddress: string;
  };
  description?: string;
  slug?: string;
  priceNegotiable?: boolean;
  category?: string;
  seller?: string;
  condition?: {
    label: string;
    percentage: number;
    isFullbox: boolean;
    warranty: string;
  };
  status?: string;
  views?: number;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
  atlasScore?: number;
};

// Backend API response format
type ApiResponse = {
  success: boolean;
  type: string;
  source?: string; // for hybrid
  data: Item[]; // Direct array of items with score and debug
};

/**
 * =====================================
 * PAGE
 * =====================================
 */

export default function RecommendationPage() {
  const [mode, setMode] = useState<Mode>("hybrid");

  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Item[]>([]);

  const [userId, setUserId] = useState<string>("");
  const [itemId, setItemId] = useState<string>("");

  const [data, setData] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  /**
   * =====================================
   * LOAD USERS + POSTS
   * =====================================
   */

  useEffect(() => {
    const loadData = async () => {
      try {
        const [userRes, postRes] = await Promise.all([
          api.get("/users"),
          api.get("/posts?limit=20"),
        ]);

        setUsers(userRes.data || []);
        setPosts(postRes.data.data || []);

        // auto select first
        if (userRes.data?.length) setUserId(userRes.data[0]._id);
        if (postRes.data.data?.length) setItemId(postRes.data.data[0]._id);
      } catch (err) {
        console.error("Load error:", err);
        setError("Failed to load users/posts");
      }
    };

    loadData();
  }, []);

  const fetchData = async () => {
    if (!itemId && mode !== "search") {
      setError("Please select an item");
      return;
    }

    if (mode === "search" && !userId) {
      setError("Please select a user for search recommendations");
      return;
    }

    try {
      setLoading(true);
      setError("");

      let url = "";
      let response;

      if (mode === "search") {
        // Search mode uses userId
        url = `/recommend/search/${userId}`;
        response = await api.get(url);
      } else {
        // Other modes use itemId, with optional userId for hybrid
        url = `/recommend/${mode}/${itemId}`;
        response = await api.get(url, {
          params: userId ? { userId } : {},
        });
      }

      const apiResponse: ApiResponse = response.data;

      if (apiResponse.success) {
        setData(apiResponse.data || []);
      } else {
        setError("API returned unsuccessful response");
        setData([]);
      }
    } catch (err: any) {
      console.error("Fetch error:", err);
      setError(err.message || "Failed to fetch recommendations");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * =====================================
   * AUTO REFRESH WHEN CHANGE
   * =====================================
   */

  useEffect(() => {
    if (mode !== "search" && itemId) {
      fetchData();
    } else if (mode === "search" && userId) {
      fetchData();
    }
  }, [mode, itemId, userId]);

  // Sort items by score (highest first)
  const sorted = [...data].sort((a, b) => b.score - a.score);

  return (
    <div className="p-6 space-y-6">
      {/* ================= HEADER ================= */}
      <h1 className="text-2xl font-bold">Hệ thống đề xuất</h1>

      {/* ================= SELECTORS ================= */}
      <div className="flex gap-4 flex-wrap">
        {/* USER SELECT - Required for search and hybrid */}
        <div className="flex flex-col">
          <label className="text-sm font-semibold mb-1">
            User (for search/hybrid)
          </label>
          <select
            className="border p-2 rounded"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          >
            <option value="">Select a user</option>
            {users.map((u) => (
              <option key={u._id} value={u._id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>

        {/* POST SELECT - Not needed for search mode */}
        <div className="flex flex-col">
          <label className="text-sm font-semibold mb-1">
            Base Item (for content/collab/hybrid)
          </label>
          <select
            className="border p-2 rounded"
            value={itemId}
            onChange={(e) => setItemId(e.target.value)}
            disabled={mode === "search"}
          >
            <option value="">Select an item</option>
            {posts.map((p) => (
              <option key={p._id} value={p._id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>

        {/* MODE SELECT */}
        <div className="flex flex-col">
          <label className="text-sm font-semibold mb-1">
            Recommendation Mode
          </label>
          <div className="flex gap-2">
            {(["content", "collaborative", "search", "hybrid"] as Mode[]).map(
              (m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`px-3 py-1 border rounded capitalize ${
                    mode === m
                      ? "bg-black text-white"
                      : "bg-white hover:bg-gray-100"
                  }`}
                >
                  {m}
                </button>
              ),
            )}
          </div>
        </div>
      </div>

      {/* ================= INFO PANEL ================= */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="text-sm">
          <strong>Current Mode:</strong> {mode}
          {mode !== "search" && itemId && (
            <span className="ml-4">
              <strong>Base Item ID:</strong> {itemId}
            </span>
          )}
          {mode === "search" && userId && (
            <span className="ml-4">
              <strong>User ID:</strong> {userId}
            </span>
          )}
          <span className="ml-4">
            <strong>Results:</strong> {sorted.length} items
          </span>
          {mode === "search" && userId && sorted?.length > 0 && (
            <span className="ml-4">
              <strong>5 keywords:</strong>{" "}
              {sorted[0]?.debug?.keywords?.slice(0, 5).join(", ")}
            </span>
          )}
        </div>
      </div>

      {/* ================= ERROR ================= */}
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg border border-red-200">
          ⚠️ {error}
        </div>
      )}

      {/* ================= LOADING ================= */}
      {loading && (
        <div className="text-gray-500 text-center py-8">
          ⏳ Loading {mode} recommendations...
        </div>
      )}

      {/* ================= RESULTS TABLE ================= */}
      {!loading && sorted.length > 0 && (
        <>
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left">Image</th>
                  <th className="p-3 text-left">Title</th>
                  <th className="p-3 text-left">Price</th>
                  <th className="p-3 text-left">Score</th>
                  <th className="p-3 text-left">Views</th>
                  {/* <th className="p-3 text-left">Status</th> */}
                </tr>
              </thead>

              <tbody>
                {sorted.map((item) => (
                  <tr key={item._id} className="border-t hover:bg-gray-50">
                    <td className="p-2">
                      <img
                        src={item.images?.[0] || "/placeholder.jpg"}
                        alt={item.title}
                        className="w-14 h-14 object-cover rounded"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "/placeholder.jpg";
                        }}
                      />
                    </td>

                    <td className="p-2">
                      <div className="font-medium">{item.title}</div>
                      {item.description && (
                        <div className="text-xs text-gray-500 truncate max-w-xs">
                          {item.description.substring(0, 60)}...
                        </div>
                      )}
                    </td>

                    <td className="p-2 text-green-600 font-semibold">
                      {item.price.toLocaleString()} ₫
                    </td>

                    <td className="p-2">
                      <span className="px-2 py-1 bg-blue-600 text-white rounded text-xs font-mono">
                        {item.score.toFixed(4)}
                      </span>
                    </td>

                    <td className="p-2 text-gray-600">
                      {item.views?.toLocaleString() || 0}
                    </td>

                    {/* <td className="p-2">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          item.status === "active"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {item.status || "N/A"}
                      </span>
                    </td> */}

                    {/* <td className="p-2">
                      {item.debug && (
                        <button
                          className="text-xs text-blue-500 hover:text-blue-700"
                          onClick={() => console.log(item.debug)}
                        >
                          {item.score}
                        </button>
                      )}
                    </td> */}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ================= CARDS VIEW ================= */}
          {/* <div>
            <h2 className="text-xl font-semibold mb-3">Card View</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {sorted.slice(0, 8).map((item) => (
                <div
                  key={item._id}
                  className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <img
                    src={item.images?.[0] || "/placeholder.jpg"}
                    alt={item.title}
                    className="w-full h-40 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/placeholder.jpg";
                    }}
                  />

                  <div className="p-3">
                    <div className="font-semibold truncate">{item.title}</div>

                    <div className="text-green-600 font-bold mt-1">
                      {item.price.toLocaleString()} ₫
                    </div>

                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-gray-500">
                        Score:{" "}
                        <span className="font-mono font-bold">
                          {item.score.toFixed(3)}
                        </span>
                      </span>
                      {item.views && (
                        <span className="text-xs text-gray-500">
                          👁️ {item.views}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div> */}
        </>
      )}

      {!loading && !error && sorted.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="text-4xl mb-3">🔍</div>
          <div className="text-gray-500">No recommendations found</div>
          {/* <div className="text-sm text-gray-400 mt-2">
            Try selecting a different {mode !== "search" ? "item" : "user"} or
            mode
          </div> */}
        </div>
      )}
    </div>
  );
}
