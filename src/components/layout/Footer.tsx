import { Link } from 'react-router-dom'
import { Sprout, Mail, Phone, MapPin } from 'lucide-react'

/**
 * Site footer with logo, links, and contact info.
 */
export function Footer() {
  return (
    <footer className="border-t border-border bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-3">
            <Link to="/" className="flex items-center gap-2 font-bold text-lg text-primary">
              <Sprout className="size-6" />
              <span>Farmify</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Empowering farmers with modern tools to sell products, find workers, and manage their farm business efficiently.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-sm mb-3">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/marketplace" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Marketplace
                </Link>
              </li>
              <li>
                <Link to="/jobs" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Job Portal
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Join Us
                </Link>
              </li>
            </ul>
          </div>

          {/* For Farmers */}
          <div>
            <h3 className="font-semibold text-sm mb-3">For Farmers</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/inventory" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Inventory Management
                </Link>
              </li>
              <li>
                <Link to="/marketplace" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Sell Products
                </Link>
              </li>
              <li>
                <Link to="/jobs/new" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Post a Job
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-sm mb-3">Contact</h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="size-4 shrink-0" />
                <span>support@farmify.com</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="size-4 shrink-0" />
                <span>+63 (2) 8123 4567</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="size-4 shrink-0 mt-0.5" />
                <span>123 Farming Road, Quezon City, Philippines</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-center">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Farmify. All rights reserved. Empowering Filipino farmers.
          </p>
        </div>
      </div>
    </footer>
  )
}
