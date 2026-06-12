import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleResetRequest = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Please enter your email address');

    setLoading(true);
    const toastId = toast.loading('Sending recovery email...');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast.success('Recovery link sent successfully!', { id: toastId });
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to send recovery email', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-medium mb-6 text-center">Recover Password</h2>
      {submitted ? (
        <div className="space-y-6 text-center">
          <p className="text-gray-300 text-sm leading-relaxed">
            We have sent a secure password reset link to <strong className="text-white">{email}</strong>. 
            Please check your inbox and spam folder.
          </p>
          <div className="pt-4 border-t border-dark-700">
            <Link to="/login" className="btn-primary inline-block w-full text-center py-3">
              Back to Sign In
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleResetRequest} className="space-y-4">
          <p className="text-gray-400 text-sm mb-4 leading-relaxed text-center">
            Enter your email address below, and we will send you a secure link to reset your account password.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-dark-900 border border-dark-700 text-white px-4 py-3 focus:outline-none focus:border-gold-500 transition-colors"
              placeholder="your-email@example.com"
              required
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-4">
            {loading ? 'Sending link...' : 'Send Reset Link'}
          </button>
          
          <div className="mt-8 pt-6 border-t border-dark-700 text-center">
            <p className="text-gray-400 text-sm">
              Remembered your password? <Link to="/login" className="text-gold-500 hover:underline">Sign in here</Link>
            </p>
          </div>
        </form>
      )}
    </div>
  );
};

export default ForgotPassword;
