'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { toast } from 'react-hot-toast';

export function AffiliateApplicationForm() {
  const { isSignedIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [applicationNote, setApplicationNote] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isSignedIn) {
      toast.error('Please sign in to apply');
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch('/api/affiliate/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applicationNote: applicationNote.trim() || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Application submitted successfully!');
        setApplicationNote('');
        // Redirect to affiliate dashboard to see status
        window.location.href = '/app/affiliate';
      } else {
        if (data.status === 'PENDING') {
          toast.error('You already have a pending application');
        } else if (data.status === 'APPROVED') {
          toast.error('You are already an approved affiliate');
        } else {
          toast.error(data.error || 'Failed to submit application');
        }
      }
    } catch (error) {
      toast.error('Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  if (!isSignedIn) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Apply to Join Our Affiliate Program</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            You need to be signed in to apply for our affiliate program.
          </p>
          <Button 
            onClick={() => window.location.href = '/sign-in'}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Sign In to Apply
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Apply to Join Our Affiliate Program</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="applicationNote" className="block text-sm font-medium text-foreground mb-2">
              Why do you want to join our affiliate program? (Optional)
            </label>
            <textarea
              id="applicationNote"
              value={applicationNote}
              onChange={(e) => setApplicationNote(e.target.value)}
              placeholder="Tell us about your audience, marketing experience, or why you'd be a great affiliate partner..."
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {applicationNote.length}/500 characters
            </p>
          </div>
          
          <Button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? 'Submitting Application...' : 'Submit Application'}
          </Button>
          
          <p className="text-xs text-muted-foreground text-center">
            Applications are reviewed within 24-48 hours. You'll be notified of the decision via email.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
