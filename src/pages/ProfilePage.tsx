import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User as UserIcon, MapPin, Plus, Trash2, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from '../hooks/useToast.tsx';

export function ProfilePage() {
  const { user, updateProfile, addAddress, deleteAddress } = useAuth();
  const { showToast } = useToast();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [label, setLabel] = useState('Home');
  const [street, setStreet] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('Mumbai');
  const [state, setState] = useState('Maharashtra');
  const [postalCode, setPostalCode] = useState('400050');
  const [addingAddr, setAddingAddr] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name);
      setPhone(user.phone);
    }
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="bg-white border border-stone-200 rounded-2xl p-8">
          <h1 className="text-xl font-bold text-stone-900">Please Sign In</h1>
          <Link
            to="/auth?redirect=/profile"
            className="mt-4 inline-block px-5 py-2.5 rounded-xl bg-orange-500 text-white text-xs font-semibold"
          >
            Go to Sign In
          </Link>
        </div>
      </div>
    );
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfile({ full_name: fullName, phone });
      showToast('Customer profile updated in MySQL users table', 'success');
    } catch (err: any) {
      showToast('Failed to update profile', 'error', err?.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!street.trim()) return;
    setAddingAddr(true);
    try {
      await addAddress({
        label,
        recipient_name: user.full_name,
        phone: user.phone,
        street_address: street,
        landmark: landmark || null,
        city,
        state,
        postal_code: postalCode,
        is_default: 1,
      });
      setStreet('');
      setLandmark('');
      showToast('Delivery address added', 'success');
    } catch (err: any) {
      showToast('Failed to add address', 'error', err?.message);
    } finally {
      setAddingAddr(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="pb-6 border-b border-stone-200">
        <div className="text-xs font-medium text-orange-600">Customer Account Management</div>
        <h1 className="text-3xl font-bold text-stone-900 mt-1">Profile & Delivery Addresses</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
        {/* Left: Personal Information */}
        <div className="lg:col-span-5 bg-white border border-stone-200 rounded-2xl p-6 h-fit">
          <div className="flex items-center gap-2.5 mb-5">
            <UserIcon className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-bold text-stone-900">Customer Information</h2>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Email Address (Primary Login · Read-Only)
              </label>
              <input
                type="email"
                disabled
                value={user.email}
                className="w-full px-3.5 py-2 text-sm border border-stone-200 bg-stone-100 rounded-xl text-stone-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-stone-300 rounded-xl focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Mobile Phone
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-stone-300 rounded-xl font-mono focus:outline-none focus:border-orange-500"
              />
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="w-full py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-orange-500 text-white text-xs font-semibold transition-colors inline-flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{savingProfile ? 'Saving...' : 'Update Customer Profile'}</span>
            </button>
          </form>
        </div>

        {/* Right: Manage Delivery Addresses */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-stone-200 rounded-2xl p-6">
            <div className="flex items-center gap-2.5 mb-4">
              <MapPin className="w-5 h-5 text-orange-500" />
              <h2 className="text-lg font-bold text-stone-900">
                Saved Delivery Addresses ({user.addresses?.length || 0})
              </h2>
            </div>

            {!user.addresses || user.addresses.length === 0 ? (
              <p className="text-xs text-stone-500">No saved delivery addresses yet.</p>
            ) : (
              <div className="space-y-3">
                {user.addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className="p-4 rounded-xl border border-stone-200 flex items-start justify-between gap-4"
                  >
                    <div>
                      <div className="text-xs font-bold text-stone-900">
                        {addr.label} · {addr.recipient_name}
                      </div>
                      <p className="text-xs text-stone-600 mt-1">
                        {addr.street_address}
                        {addr.landmark ? `, ${addr.landmark}` : ''}, {addr.city}, {addr.state} -{' '}
                        <span className="font-mono">{addr.postal_code}</span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteAddress(addr.id)}
                      className="p-1.5 text-stone-400 hover:text-red-600 transition-colors"
                      aria-label="Delete address"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <form
              onSubmit={handleAddAddress}
              className="mt-6 pt-6 border-t border-stone-200 space-y-3"
            >
              <h3 className="text-sm font-bold text-stone-900">Add New Delivery Address</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-stone-600 mb-1">Address Label</label>
                  <select
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl bg-white"
                  >
                    <option value="Home">Home</option>
                    <option value="Office">Office</option>
                    <option value="Hostel / College">Hostel / College</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs text-stone-600 mb-1">
                    Street / Building Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="Flat 302, Sunrise Residency, MG Road"
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="Landmark"
                  className="px-3 py-2 text-xs border border-stone-300 rounded-xl"
                />
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City"
                  className="px-3 py-2 text-xs border border-stone-300 rounded-xl"
                />
                <input
                  type="text"
                  required
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="State"
                  className="px-3 py-2 text-xs border border-stone-300 rounded-xl"
                />
                <input
                  type="text"
                  required
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="PIN Code"
                  className="px-3 py-2 text-xs border border-stone-300 rounded-xl font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={addingAddr}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>{addingAddr ? 'Adding...' : 'Save Address'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
