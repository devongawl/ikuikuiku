import type { DialogueOptions } from '../types';

interface DialogueItem {
  text: string;
  duration: number | null;
}

export class DialogueSystem {
  private container: HTMLDivElement;
  private textElement: HTMLParagraphElement;
  private isShowing: boolean;
  private queue: DialogueItem[];
  private currentDialogue: DialogueItem | null;

  constructor() {
    this.isShowing = false;
    this.queue = [];
    this.currentDialogue = null;
    
    // Initialize elements
    this.container = document.createElement('div');
    this.textElement = document.createElement('p');
    
    this.createElements();
  }

  private createElements(): void {
    // Create dialogue container
    this.container.style.cssText = `
      position: fixed;
      bottom: 20%;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(255, 182, 193, 0.95);
      border: 3px solid #FFB6C1;
      border-radius: 15px;
      padding: 20px 30px;
      font-family: 'Press Start 2P', cursive;
      font-size: 14px;
      color: #333;
      max-width: 80%;
      text-align: center;
      opacity: 0;
      transition: opacity 0.3s ease-in-out;
      pointer-events: none;
      z-index: 1000;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    `;
    
    // Create text element
    this.textElement.style.margin = '0';
    this.container.appendChild(this.textElement);
    
    // Add click hint
    const hint = document.createElement('div');
    hint.style.cssText = `
      font-size: 10px;
      margin-top: 15px;
      opacity: 0.7;
    `;
    hint.textContent = 'Click to continue...';
    this.container.appendChild(hint);
    
    // Add to DOM
    document.body.appendChild(this.container);
    
    // Add click handler
    document.addEventListener('click', () => {
      if (this.isShowing) {
        this.next();
      }
    });
  }

  show(text: string, duration: number | null = null): void {
    this.queue.push({ text, duration });
    
    if (!this.isShowing) {
      this.showNext();
    }
  }

  private showNext(): void {
    if (this.queue.length === 0) {
      this.hide();
      return;
    }
    
    const dialogue = this.queue.shift()!;
    this.currentDialogue = dialogue;
    this.isShowing = true;
    
    // Update text with typewriter effect
    this.typewriterEffect(dialogue.text);
    
    // Show container
    this.container.style.opacity = '1';
    this.container.style.pointerEvents = 'auto';
    
    // Auto-hide if duration is specified
    if (dialogue.duration) {
      setTimeout(() => {
        this.next();
      }, dialogue.duration);
    }
  }

  private typewriterEffect(text: string): void {
    let index = 0;
    this.textElement.textContent = '';
    
    const type = () => {
      if (index < text.length) {
        this.textElement.textContent += text.charAt(index);
        index++;
        setTimeout(type, 50);
      }
    };
    
    type();
  }

  next(): void {
    if (this.queue.length > 0) {
      this.showNext();
    } else {
      this.hide();
    }
  }

  hide(): void {
    this.isShowing = false;
    this.currentDialogue = null;
    this.container.style.opacity = '0';
    this.container.style.pointerEvents = 'none';
  }

  clear(): void {
    this.queue = [];
    this.hide();
  }

  // Show a temporary notification
  notify(text: string, duration: number = 3000): void {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20%;
      left: 50%;
      transform: translateX(-50%) translateY(-20px);
      background: rgba(255, 215, 0, 0.95);
      border: 2px solid #FFD700;
      border-radius: 10px;
      padding: 15px 25px;
      font-family: 'Press Start 2P', cursive;
      font-size: 12px;
      color: #333;
      opacity: 0;
      transition: all 0.3s ease-in-out;
      z-index: 1001;
    `;
    notification.textContent = text;
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.style.opacity = '1';
      notification.style.transform = 'translateX(-50%) translateY(0)';
    }, 10);
    
    // Remove after duration
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(-50%) translateY(-20px)';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, duration);
  }

  // Advanced show method with options
  showWithOptions(text: string, options: DialogueOptions = {}): void {
    // For now, just use the duration option
    this.show(text, options.duration || null);
    
    // In the future, we can implement emotion-based styling
    // and different positions based on the options
  }
} 