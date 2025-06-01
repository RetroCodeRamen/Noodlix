# 🍜 Noodlix Terminal (Bashimi Shell)

> *"OMG, you won't believe what started as a 'let's see what Firebase can do' turned into! It's like when you're just making instant ramen but end up creating a gourmet bowl!"* - RetroCodeRamen

Hey there, fellow retro-tech enthusiast! 👋 Welcome to Noodlix, where we're serving up a piping hot bowl of browser-based terminal goodness! 🥢 

Picture this: I was just casually tinkering with Firebase, thinking "hmm, let's see what this baby can do" when BAM! 💥 The idea for Noodlix hit me like a perfectly cooked noodle! After some delicious experimentation, I moved the project to Cursor and just kept adding more and more fun features. It's like when you start adding toppings to your ramen and suddenly you've created a masterpiece! 

Inspired by the pixel-perfect charm of platforms like Picotron, Noodlix brings that cozy, nostalgic terminal experience right to your browser. It's like having your own digital ramen shop where instead of serving noodles, we're serving up terminal commands! And the best part? Everything runs right in your browser - it's like having a tiny computer in your pocket! 🖥️✨

## 🌟 The Tasty Journey

The story of Noodlix is like the perfect bowl of ramen - it started simple but got more interesting with every step:

1. 🥢 Started as a "let's see what Firebase can do" experiment
2. 🍜 Got totally hooked on the possibilities (like when you discover a new ramen topping)
3. 🥄 Moved to Cursor for that extra development flavor
4. 🔥 Kept adding features just for the fun of it
5. ✨ Ended up with a full-featured browser terminal that's as satisfying as a perfect bowl of ramen!

What makes Noodlix extra special is that it lives entirely in your browser - no server needed! (Well, except for that tiny web proxy, but that's just the soy sauce on top! 🥄) Everything from the file system to user authentication happens right in your browser using `localStorage`. It's like having a tiny computer inside your browser that you can take anywhere! 

## 🎮 What's in This Delicious Bowl?

- 🖥️ A fully functional terminal emulator that's as smooth as a perfectly cooked noodle
- 📁 Virtual file system that sticks around like your favorite ramen shop
- 👤 User management system that's as organized as a well-stocked kitchen
- 🌐 Web utilities for browsing and downloading (like having a menu of options!)
- ✨ And a whole lot of retro-tech charm that'll make you feel like you're back in the '90s!

## 🚀 Quick Start

### Prerequisites
- Node.js 18.x or later
- npm 9.x or later
- A modern web browser (Chrome, Firefox, Safari, or Edge)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/RetroCodeRamen/Noodlix.git
cd Noodlix
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to:
```
http://localhost:9002
```

5. Login with default credentials:
- Username: `root`
- Password: `toor`

## 🏗️ Technical Architecture

### Core Components

#### 1. Browser-Based Storage
- **File System**: Implemented using `localStorage` with a custom serialization system
- **User Data**: Stored in `localStorage` with JSON serialization
- **Session Management**: Client-side session handling with automatic timeout

#### 2. Virtual File System
- Hierarchical file structure
- Unix-like permissions system
- Support for:
  - File operations (create, read, write, delete)
  - Directory operations (create, navigate, list)
  - Symbolic links (planned)
  - File permissions (read, write, execute)

#### 3. Authentication System
- Client-side authentication
- User management (create, delete, modify)
- Role-based access control
- Password management

#### 4. Terminal Emulator
- Custom command parser
- Command history
- Tab completion
- ANSI color support
- Custom prompt system

### Technology Stack

#### Frontend
- **Next.js 15.2.3**: Framework and API routes
- **React**: UI components and state management
- **TypeScript**: Type safety and development experience
- **Tailwind CSS**: Utility-first styling
- **ShadCN UI**: Component library

#### Browser APIs
- `localStorage`: Data persistence
- `Web APIs`: File operations
- `Security Sandbox`: Browser security model

#### Development Tools
- ESLint: Code linting
- Prettier: Code formatting
- TypeScript: Static type checking

## 🔧 Available Commands

### File System
- `ls`: List directory contents
- `cd`: Change directory
- `pwd`: Print working directory
- `mkdir`: Create directory
- `touch`: Create file
- `cat`: Display file contents
- `rm`: Remove files/directories

### User Management
- `useradd`: Create new user
- `userdel`: Delete user
- `passwd`: Change password
- `whoami`: Display current user

### System
- `clear`: Clear terminal
- `logout`: End session
- `help`: Display help
- `chef`: Show command manual

### Web Utilities
- `wget`: Download files
- `noodl`: Text-based web browser

## 🎯 Development

### Project Structure
```
noodlix/
├── src/
│   ├── app/          # Next.js app router
│   ├── components/   # React components
│   ├── core/         # Core functionality
│   ├── hooks/        # Custom React hooks
│   ├── types/        # TypeScript types
│   └── lib/          # Utility functions
├── public/           # Static assets
└── docs/            # Documentation
```

### Running Tests
```bash
npm test
```

### Building for Production
```bash
npm run build
npm start
```

## 🔐 Security Considerations

### Client-Side Security
- All data is stored in browser's `localStorage`
- No server-side authentication
- Data is not encrypted (planned feature)
- Clearing browser data will reset the system

### Best Practices
1. Change default root password immediately
2. Use strong passwords
3. Regular backups of important data
4. Be aware of browser storage limitations

## 🌐 Browser Support

- Chrome 90+
- Firefox 90+
- Safari 14+
- Edge 90+

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by Picotron and other retro computing projects
- Built with modern web technologies
- Created by RetroCodeRamen

---

Happy Noodling! 🍜✨ 