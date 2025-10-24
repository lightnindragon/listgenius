'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/EmptyState';
import { TopRightToast, emitTopRightToast } from '@/components/TopRightToast';
import { SEOGradeCard } from '@/components/SEOGradeCard';
import { 
  getSEOGrader, 
  SEOGrade, 
  ListingData,
  SEOGradingCriteria 
} from '@/lib/seo-grader';
import { 
  Award, 
  Search, 
  Filter, 
  RefreshCw, 
  Download, 
  TrendingUp,
  TrendingDown,
  CheckCircle,
  AlertTriangle,
  Eye,
  BarChart3,
  Target,
  Clock,
  Plus
} from 'lucide-react';
import { getBaseUrl } from '@/lib/utils';

interface Listing {
  id: number;
  title: string;
  description: string;
  tags: string[];
  images: Array<{ url: string; altText?: string }>;
  price: number;
  reviews: { count: number; average: number };
  favorites: number;
  views: number;
  category: string;
  createdAt: Date;
}

export default function SEOGraderPage() {
  const { user, isLoaded } = useUser();
  const [listings, setListings] = useState<Listing[]>([]);
  const [grades, setGrades] = useState<Map<number, SEOGrade>>(new Map());
  const [loading, setLoading] = useState(false);
  const [selectedListings, setSelectedListings] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState('all');
  const [sortBy, setSortBy] = useState<'grade' | 'title' | 'date'>('grade');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showHistory, setShowHistory] = useState(false);

  const seoGrader = getSEOGrader();

  useEffect(() => {
    if (user && isLoaded) {
      loadListings();
    }
  }, [user, isLoaded]);

  const loadListings = async () => {
    setLoading(true);
    try {
      // Mock listings data - in real implementation, this would fetch from Etsy API
      const mockListings: Listing[] = [
        {
          id: 1,
          title: 'Handmade Silver Ring with Intricate Celtic Design',
          description: 'Beautiful handmade silver ring featuring intricate Celtic knotwork design. Perfect for any occasion. Made with love and attention to detail.',
          tags: ['handmade', 'silver', 'ring', 'celtic', 'jewelry', 'artisan', 'unique'],
          images: [
            { url: 'ring1.jpg', altText: 'Silver ring front view' },
            { url: 'ring2.jpg', altText: 'Silver ring side view' }
          ],
          price: 45.99,
          reviews: { count: 25, average: 4.8 },
          favorites: 150,
          views: 1200,
          category: 'jewelry',
          createdAt: new Date(Date.now() - 86400000)
        },
        {
          id: 2,
          title: 'Ring',
          description: 'Nice ring.',
          tags: ['ring'],
          images: [
            { url: 'ring3.jpg' }
          ],
          price: 20,
          reviews: { count: 2, average: 3.5 },
          favorites: 5,
          views: 50,
          category: 'jewelry',
          createdAt: new Date(Date.now() - 172800000)
        },
        {
          id: 3,
          title: 'Custom Art Print - Beautiful Landscape Painting',
          description: 'High-quality custom art print featuring a beautiful landscape painting. Perfect for home decoration. Printed on premium paper with fade-resistant ink.',
          tags: ['art', 'print', 'custom', 'landscape', 'wall', 'decor', 'painting'],
          images: [
            { url: 'art1.jpg', altText: 'Landscape art print' }
          ],
          price: 22.00,
          reviews: { count: 42, average: 4.9 },
          favorites: 89,
          views: 850,
          category: 'art-supplies',
          createdAt: new Date(Date.now() - 259200000)
        }
      ];

      setListings(mockListings);
      await gradeAllListings(mockListings);
    } catch (error) {
      console.error('Error loading listings:', error);
      emitTopRightToast('Failed to load listings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const gradeAllListings = async (listingsToGrade: Listing[]) => {
    setLoading(true);
    try {
      const newGrades = new Map<number, SEOGrade>();

      for (const listing of listingsToGrade) {
        try {
          const listingData: ListingData = {
            listingId: listing.id,
            title: listing.title,
            description: listing.description,
            tags: listing.tags,
            images: listing.images,
            price: listing.price,
            currency: 'USD',
            reviews: listing.reviews,
            favorites: listing.favorites,
            views: listing.views,
            category: listing.category
          };

          const grade = await seoGrader.gradeListing(listingData);
          newGrades.set(listing.id, grade);
        } catch (error) {
          console.error(`Failed to grade listing ${listing.id}:`, error);
        }
      }

      setGrades(newGrades);
      emitTopRightToast('SEO grading complete!', 'success');
    } catch (error) {
      console.error('Error grading listings:', error);
      emitTopRightToast('Failed to grade listings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectListing = (listingId: number) => {
    const newSelected = new Set(selectedListings);
    if (newSelected.has(listingId)) {
      newSelected.delete(listingId);
    } else {
      newSelected.add(listingId);
    }
    setSelectedListings(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedListings.size === filteredListings.length) {
      setSelectedListings(new Set());
    } else {
      setSelectedListings(new Set(filteredListings.map(l => l.id)));
    }
  };

  const handleBulkGrade = async () => {
    if (selectedListings.size === 0) {
      emitTopRightToast('Please select listings to grade', 'error');
      return;
    }

    const selectedListingsData = listings.filter(l => selectedListings.has(l.id));
    await gradeAllListings(selectedListingsData);
  };

  const filteredListings = listings.filter(listing => {
    const matchesSearch = listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         listing.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (filterGrade === 'all') return matchesSearch;
    
    const grade = grades.get(listing.id);
    if (!grade) return matchesSearch;
    
    const gradeLetter = grade.overall.charAt(0);
    return matchesSearch && gradeLetter === filterGrade;
  });

  const sortedListings = [...filteredListings].sort((a, b) => {
    const gradeA = grades.get(a.id);
    const gradeB = grades.get(b.id);
    
    switch (sortBy) {
      case 'grade':
        if (!gradeA || !gradeB) return 0;
        const scoreA = gradeA.score;
        const scoreB = gradeB.score;
        return sortOrder === 'asc' ? scoreA - scoreB : scoreB - scoreA;
      case 'title':
        return sortOrder === 'asc' ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title);
      case 'date':
        return sortOrder === 'asc' ? a.createdAt.getTime() - b.createdAt.getTime() : b.createdAt.getTime() - a.createdAt.getTime();
      default:
        return 0;
    }
  });

  const getGradeStats = () => {
    const stats = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    grades.forEach(grade => {
      const letter = grade.overall.charAt(0);
      if (letter in stats) {
        stats[letter as keyof typeof stats]++;
      }
    });
    return stats;
  };

  const getGradeColor = (grade: string) => {
    const letter = grade.charAt(0);
    switch (letter) {
      case 'A': return 'text-green-600 bg-green-100';
      case 'B': return 'text-blue-600 bg-blue-100';
      case 'C': return 'text-yellow-600 bg-yellow-100';
      case 'D': return 'text-orange-600 bg-orange-100';
      case 'F': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const gradeStats = getGradeStats();

  if (!user) {
    return (
      <div className="max-w-md mx-auto text-center py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Sign in required
        </h1>
        <p className="text-gray-600 mb-6">
          Please sign in to access the SEO grader.
        </p>
        <a
          href="/sign-in"
          className="inline-flex items-center px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
        >
          Sign In
        </a>
      </div>
    );
  }

  return (
    <DashboardLayout onCreateListingClick={() => {}}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">SEO Grader</h1>
            <p className="text-gray-600">
              Grade your listings with A-F scores and get actionable SEO improvements.
            </p>
          </div>
          <div className="flex space-x-3">
            <Button
              onClick={() => gradeAllListings(listings)}
              disabled={loading}
              variant="outline"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Re-grade All
            </Button>
            <Button
              onClick={() => emitTopRightToast('Export functionality coming soon!', 'info')}
              variant="outline"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Grade Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {Object.entries(gradeStats).map(([grade, count]) => (
            <div key={grade} className="bg-white rounded-lg border border-gray-200 p-4 text-center">
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-2 ${getGradeColor(grade)}`}>
                <span className="text-xl font-bold">{grade}</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{count}</div>
              <div className="text-sm text-gray-600">Listings</div>
            </div>
          ))}
        </div>

        {/* Filters and Controls */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search listings or tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="md:w-48">
              <select
                value={filterGrade}
                onChange={(e) => setFilterGrade(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              >
                <option value="all">All Grades</option>
                <option value="A">A Grades</option>
                <option value="B">B Grades</option>
                <option value="C">C Grades</option>
                <option value="D">D Grades</option>
                <option value="F">F Grades</option>
              </select>
            </div>
            <div className="md:w-48">
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [newSortBy, newSortOrder] = e.target.value.split('-');
                  setSortBy(newSortBy as any);
                  setSortOrder(newSortOrder as any);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              >
                <option value="grade-desc">Grade (High to Low)</option>
                <option value="grade-asc">Grade (Low to High)</option>
                <option value="title-asc">Title (A-Z)</option>
                <option value="title-desc">Title (Z-A)</option>
                <option value="date-desc">Date (Newest)</option>
                <option value="date-asc">Date (Oldest)</option>
              </select>
            </div>
          </div>

          {selectedListings.size > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {selectedListings.size} listings selected
                </span>
                <div className="flex space-x-2">
                  <Button
                    onClick={handleSelectAll}
                    variant="outline"
                    size="sm"
                  >
                    {selectedListings.size === filteredListings.length ? 'Deselect All' : 'Select All'}
                  </Button>
                  <Button
                    onClick={handleBulkGrade}
                    disabled={loading}
                    size="sm"
                  >
                    <Award className="h-4 w-4 mr-2" />
                    Grade Selected
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Listings and Grades */}
        {loading ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="grid grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-24 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <EmptyState
              icon={<Award className="h-16 w-16 text-gray-400" />}
              title="No listings found"
              description="No listings match your search criteria."
              action={
                <Button onClick={() => { setSearchTerm(''); setFilterGrade('all'); }}>
                  Clear Filters
                </Button>
              }
            />
          </div>
        ) : (
          <div className="space-y-6">
            {sortedListings.map((listing) => {
              const grade = grades.get(listing.id);
              
              return (
                <div key={listing.id} className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <input
                        type="checkbox"
                        checked={selectedListings.has(listing.id)}
                        onChange={() => handleSelectListing(listing.id)}
                        className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                      />
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {listing.title}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>Category: {listing.category}</span>
                          <span>Views: {listing.views}</span>
                          <span>Favorites: {listing.favorites}</span>
                          <span>Reviews: {listing.reviews.count}</span>
                        </div>
                      </div>
                    </div>
                    {grade && (
                      <div className="text-right">
                        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-2 ${getGradeColor(grade.overall)}`}>
                          <span className="text-2xl font-bold">{grade.overall}</span>
                        </div>
                        <div className="text-sm text-gray-600">Score: {grade.score}/100</div>
                      </div>
                    )}
                  </div>

                  {grade && (
                    <SEOGradeCard
                      grade={grade}
                      listing={listing}
                      onApplyFix={(fixType) => {
                        emitTopRightToast(`Applying ${fixType} fix...`, 'info');
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      <TopRightToast />
    </DashboardLayout>
  );
}
