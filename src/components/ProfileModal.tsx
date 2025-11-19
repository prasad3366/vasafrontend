import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogCancel,
  AlertDialogAction,
  AlertDialogDescription,
} from './ui/alert-dialog';
import { Button } from './ui/button';

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ open, onClose }) => {
  const { user } = useAuth ? useAuth() : { user: null };
  const [profile, setProfile] = useState<any>(null);
  const [form, setForm] = useState({
    email: '',
    phone_number: '',
    password: '',
    confirm_password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (open) {
      setLoading(true);
        axios.get(`${import.meta.env.VITE_API_BASE_URL || ''}/profile`)
          .then((res: any) => {
            const profileData = res.data && res.data.profile ? res.data.profile : {};
            console.log('Fetched profile:', profileData); // Debug log
            setProfile(profileData);
            setForm({
              email: profileData.email || '',
              phone_number: profileData.phone_number || '',
              password: '',
              confirm_password: '',
            });
            setLoading(false);
          })
          .catch((err: any) => {
            setError('Failed to fetch profile');
            setLoading(false);
            console.error('Profile fetch error:', err);
          });
    }
  }, [open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      // Only send fields that are not empty
      const updateData: any = {};
      if (form.email) updateData.email = form.email;
      if (form.phone_number) updateData.phone_number = form.phone_number;
      if (form.password) updateData.password = form.password;
      if (form.confirm_password) updateData.confirm_password = form.confirm_password;
      const token = localStorage.getItem('token');
      const res = await axios.put('http://127.0.0.1:5000/profile/update', updateData, {
        headers: {
          Authorization: token || '',
          'Content-Type': 'application/json',
        },
      });
      setSuccess((res.data as { message?: string })?.message || 'Profile updated!');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>My Profile</AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogDescription>
          View and update your profile information. You can change your email, phone number, or password here.
        </AlertDialogDescription>
        <div className="min-w-[320px]">
          {loading ? <div>Loading...</div> : profile && (
            <form onSubmit={handleUpdate} className="flex flex-col gap-3">
              <div>
                <label className="block text-sm">Username</label>
                <input
                  type="text"
                  value={user?.username || profile?.username || 'Username not available'}
                  disabled
                  className="w-full border rounded px-2 py-1 bg-gray-100"
                  placeholder="Username not available"
                />
              </div>
              <div>
                <label className="block text-sm">Email</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} className="w-full border rounded px-2 py-1" />
              </div>
              <div>
                <label className="block text-sm">Phone Number</label>
                <input type="text" name="phone_number" value={form.phone_number} onChange={handleChange} className="w-full border rounded px-2 py-1" />
              </div>
              <div>
                <label className="block text-sm">New Password</label>
                <input type="password" name="password" value={form.password} onChange={handleChange} className="w-full border rounded px-2 py-1" />
              </div>
              <div>
                <label className="block text-sm">Confirm Password</label>
                <input type="password" name="confirm_password" value={form.confirm_password} onChange={handleChange} className="w-full border rounded px-2 py-1" />
              </div>
              {error && <div className="text-red-500 text-sm">{error}</div>}
              {success && <div className="text-green-500 text-sm">{success}</div>}
              <Button type="submit" disabled={loading}>Update Profile</Button>
            </form>
          )}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Close</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
