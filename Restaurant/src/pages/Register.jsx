import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthService from '@/services/AuthService';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChefHat, Mail, Lock, User, ArrowRight, CheckCircle } from 'lucide-react';

export default function Register() {
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: '',
        password2: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.password2) {
            setError('Passwords do not match.');
            return;
        }
        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }

        setIsLoading(true);
        try {
            await AuthService.register({
                full_name: formData.full_name,
                email: formData.email,
                password: formData.password,
                password2: formData.password2,
            });
            setSuccess(true);
            setTimeout(() => {
                window.location.href = '/Login';
            }, 3000);
        } catch (err) {
            const data = err.response?.data;
            if (data) {
                const messages = Object.values(data).flat().join(' ');
                setError(messages || 'Registration failed. Please try again.');
            } else {
                setError('Registration failed. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-stone-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-stone-900 mb-2">You're in!</h2>
                    <p className="text-stone-600 mb-4">Your account has been created. Redirecting to sign in...</p>
                    <Link to="/Login">
                        <Button className="bg-stone-900 hover:bg-stone-800 text-white rounded-xl px-8">
                            Go to Sign In
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-stone-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center shadow-lg">
                        <ChefHat className="w-6 h-6 text-white" />
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-bold text-stone-900">
                    Create your account
                </h2>
                <p className="mt-2 text-center text-sm text-stone-600">
                    Join TableTaste to explore and reserve restaurants
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow-xl shadow-stone-200/50 sm:rounded-2xl sm:px-10 border border-stone-100">
                    <form className="space-y-5" onSubmit={handleSubmit}>
                        {/* Full Name */}
                        <div>
                            <Label htmlFor="full_name">Full Name</Label>
                            <div className="mt-1 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-stone-400" />
                                </div>
                                <Input
                                    id="full_name"
                                    name="full_name"
                                    type="text"
                                    value={formData.full_name}
                                    onChange={handleChange}
                                    className="pl-10"
                                    placeholder="John Doe"
                                    required
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <Label htmlFor="email">Email address</Label>
                            <div className="mt-1 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-stone-400" />
                                </div>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="pl-10"
                                    placeholder="name@example.com"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <Label htmlFor="password">Password</Label>
                            <div className="mt-1 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-stone-400" />
                                </div>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="pl-10"
                                    placeholder="Minimum 8 characters"
                                    required
                                />
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <Label htmlFor="password2">Confirm Password</Label>
                            <div className="mt-1 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-stone-400" />
                                </div>
                                <Input
                                    id="password2"
                                    name="password2"
                                    type="password"
                                    value={formData.password2}
                                    onChange={handleChange}
                                    className="pl-10"
                                    placeholder="Re-enter your password"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-100">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-stone-900 hover:bg-stone-800 text-white py-6 rounded-xl text-lg font-semibold transition-all group"
                        >
                            {isLoading ? 'Creating account...' : 'Create Account'}
                            {!isLoading && <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                        </Button>
                    </form>
                </div>

                <p className="mt-6 text-center text-sm text-stone-600">
                    Already have an account?{' '}
                    <Link to="/Login" className="font-semibold text-amber-600 hover:text-amber-500">
                        Sign in
                    </Link>
                </p>

                <p className="mt-3 text-center text-sm text-stone-500">
                    Are you a restaurant owner?{' '}
                    <Link to="/PartnerWithUs" className="font-semibold text-amber-600 hover:text-amber-500">
                        Partner With Us
                    </Link>
                </p>
            </div>
        </div>
    );
}
