import React, { useEffect, useState } from "react";
import { useDesktopStore } from "@/store";
import { apiClient } from "@/services/api";
import type { Community } from "@/types";

export const CommunitiesPage: React.FC = () => {
  const { user } = useDesktopStore();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joiningCommunity, setJoiningCommunity] = useState<string | null>(null);

  useEffect(() => {
    loadCommunities();
  }, []);

  const loadCommunities = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getCommunities(1, 20);
      if (response.success && response.data) {
        setCommunities(response.data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load communities");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinCommunity = async (communityId: string) => {
    if (!user) return;

    try {
      setJoiningCommunity(communityId);
      const response = await apiClient.joinCommunity(communityId);
      if (response.success) {
        // Refresh communities to update member count
        await loadCommunities();
      }
    } catch (err: any) {
      setError(err.message || "Failed to join community");
    } finally {
      setJoiningCommunity(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
        {error}
      </div>
    );
  }

  return (
    <div className="h-full bg-white">
      <div className="border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">Communities</h1>
        <p className="text-sm text-gray-600">Discover and join communities</p>
      </div>

      <div className="p-6">
        {communities.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              <svg
                className="mx-auto h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No communities yet
            </h3>
            <p className="text-gray-500">Be the first to create a community!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {communities.map((community) => (
              <div
                key={community.id}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                    {community.avatar ? (
                      <img
                        src={community.avatar}
                        alt={community.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : (
                      <span className="text-lg font-bold text-indigo-600">
                        {community.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {community.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {community.memberCount} members
                    </p>
                  </div>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {community.description}
                </p>

                <div className="flex justify-between items-center">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {community.isPrivate ? "Private" : "Public"}
                  </span>
                  <button
                    onClick={() => handleJoinCommunity(community.id)}
                    disabled={joiningCommunity === community.id}
                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {joiningCommunity === community.id ? "Joining..." : "Join"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create community button */}
        <div className="mt-8 text-center">
          <button className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition-colors">
            Create New Community
          </button>
        </div>
      </div>
    </div>
  );
};
