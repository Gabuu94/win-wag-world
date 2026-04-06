## Implementation Plan

### Phase 1: Database Setup
- Create `promotions` table for time-limited deals
- Create `admin_games` table for custom games with full market data
- Create `admin_game_markets` table for detailed betting markets per game
- Create `support_messages` table for admin-client chat
- Create `user_roles` table for admin role management
- Set up RLS policies and admin role checking

### Phase 2: Admin Authentication & Role
- Create admin user role system (security-definer function)
- Seed admin account (betking.admin@gmail.com / 125050.Lit)
- Create admin route guard component

### Phase 3: Admin Dashboard Pages
- **Admin Layout** with sidebar navigation
- **Dashboard Overview** - stats, recent activity
- **Customer Management** - view all users, balances, revoke/permit/delete
- **Deposits & Withdrawals** - view all transactions with filters
- **Support Chat** - real-time messaging with clients
- **Game Creator** - full custom game creation with:
  - Sport selection (Football, NBA, Tennis, etc.)
  - Team/player names
  - Match time and end time
  - Odds for all markets (1X2, corners, cards, over/under, halftime, quarters)
  - Extra time, penalties options
  - Result setting at specific minutes
  - Publish to live site
- **Promotions Manager** - create/edit time-limited bonus deals

### Phase 4: Client-Facing
- Promotions page showing active deals
- Custom admin games appearing in live feed
- Support chat integration for clients

### Key Security
- Admin role stored in separate `user_roles` table
- All admin endpoints use security-definer functions
- RLS policies prevent non-admin access
