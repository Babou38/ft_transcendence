export class ValidationService
{
    static sanitizeString(input: string): string
    {
        if (typeof input !== 'string')
            throw new Error('Input must be a string');
        
        return input
            .trim()
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
    }
    
    static validateUsername(username: string): string
    {
        if (!username)
            throw new Error('Username is required');
        
        username = username.trim();
        
        if (username.length < 3)
            throw new Error('Username must be at least 3 characters');
        
        if (username.length > 20)
            throw new Error('Username must be at most 20 characters');
        
        if (!/^[a-zA-Z0-9_-]+$/.test(username))
            throw new Error('Username can only contain letters, numbers, underscores and hyphens');
        
        return username;
    }
    
    static validateEmail(email: string): string
    {
        if (!email)
            throw new Error('Email is required');
        
        email = email.trim().toLowerCase();
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!emailRegex.test(email))
            throw new Error('Invalid email format');
        
        if (email.length > 255)
            throw new Error('Email is too long');
        
        return email;
    }
    
    static validatePassword(password: string): void
    {
        if (!password)
            throw new Error('Password is required');
        
        if (password.length < 8)
            throw new Error('Password must be at least 8 characters');
        
        if (password.length > 100)
            throw new Error('Password is too long');
        
        if (!/[a-zA-Z]/.test(password))
            throw new Error('Password must contain at least one letter');
        
        if (!/[0-9]/.test(password))
            throw new Error('Password must contain at least one number');
    }
    
    static validateId(id: any): number
    {
        const parsed = parseInt(id, 10);
        
        if (isNaN(parsed))
            throw new Error('Invalid ID: must be a number');
        
        if (parsed <= 0)
            throw new Error('Invalid ID: must be positive');
        
        return parsed;
    }
    
    static validateText(text: string, maxLength: number = 1000): string
    {
        if (typeof text !== 'string')
            throw new Error('Text must be a string');
        
        text = text.trim();
        
        if (text.length > maxLength)
            throw new Error(`Text is too long (max ${maxLength} characters)`);
        return this.sanitizeString(text);
    }
    
    static sanitizeObject(obj: any): any
    {
        if (typeof obj !== 'object' || obj === null)
            return obj;
        
        if (Array.isArray(obj))
            return obj.map(item => this.sanitizeObject(item));
        
        const sanitized: any = {};
        for (const key in obj)
        {
            const value = obj[key];
            
            if (typeof value === 'string')
                sanitized[key] = this.sanitizeString(value);
            else if (typeof value === 'object')
                sanitized[key] = this.sanitizeObject(value);
            else
                sanitized[key] = value;
        }
        
        return sanitized;
    }
}
