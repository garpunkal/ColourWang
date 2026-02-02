# Configuration Guide

This directory contains all shared configuration files for the ColourWang project. Both client and server applications reference these centralized configuration files.

## Configuration Files

### Core Game Configuration
- **`questions.json`** - Game questions database with answers and round assignments
- **`palette.json`** - Color palette definitions with names and hex codes
- **`avatars.json`** - Player avatar configurations (colors, styles, names)
- **`rounds.json`** - Round metadata (titles, descriptions, categories)
- **`gameDefaults.json`** - Default game settings (rounds, questions per round, timers, features)
- **`music.json`** - Background music track definitions

### System Configuration  
- **`server.json`** - Server and networking configuration (ports, SSL, CORS, timings)
- **`environment.json`** - Environment-specific settings (development vs production)
- **`deployment.json`** - Deployment and production settings (ngrok, optimization)

## Key Benefits

✅ **Single Source of Truth** - No more duplicate config files between client/server  
✅ **Easy Maintenance** - Update once, applies everywhere  
✅ **Environment Flexibility** - Easy to configure for different deployments  
✅ **Centralized Timing** - All delays and intervals configurable in one place  

## Configuration Examples

### Timing Adjustments
Edit `server.json` to adjust game timing:
```json
{
  "timings": {
    "roundIntroDelay": 5000,     // 5 seconds before countdown
    "countdownDelay": 4800,      // 4.8 seconds countdown duration  
    "autoStartTimer": 30,        // 30 seconds lobby auto-start
    "stealNoticeDelay": 3500     // 3.5 seconds steal notification
  }
}
```

### Network Configuration
Edit `server.json` for different ports or SSL settings:
```json
{
  "server": {
    "port": 3001,               // Server port
    "protocol": "auto"          // "auto", "http", or "https"
  },
  "client": {
    "port": 5173,              // Client dev server port
    "proxy": {
      "socketTarget": "https://localhost:3001"
    }
  }
}
```

### Environment Settings
Edit `environment.json` for development vs production:
```json
{
  "features": {
    "development": true,        // Enable dev mode
    "logging": true,           // Verbose logging
    "debugMode": true         // Debug UI elements
  }
}
```

## Adding New Configuration

1. Add your config values to the appropriate JSON file
2. Import the config in your TypeScript files:
   ```typescript
   import serverConfig from '../../../config/server.json';
   ```
3. Use the config values instead of hardcoded values:
   ```typescript
   const port = serverConfig.server.port;
   ```

## Migration Notes

This centralized config replaces the previous scattered configuration:
- ❌ `client/src/config/questions.json` → ✅ `config/questions.json`
- ❌ `server/src/config/palette.json` → ✅ `config/palette.json`  
- ❌ Hardcoded ports in multiple files → ✅ `config/server.json`
- ❌ Hardcoded timeouts in code → ✅ `config/server.json` timings