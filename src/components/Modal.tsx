import React from 'react';
import { useModalFocus } from '../hooks/useModalFocus';
import { Icon } from './icons/Icon';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: string;
  children: React.ReactNode;
  maxWidth?: string;
  className?: string;
  headerRight?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  maxWidth = '860px',
  className = '',
  headerRight,
}) => {
  const { containerRef } = useModalFocus<HTMLDivElement>({
    isOpen,
    onClose,
    canCloseOnEscape: true,
  });

  if (!isOpen) return null;

  return (
    <div
      className="overlay open"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(5, 7, 10, 0.8)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '6vh 20px',
        zIndex: 1000,
        overflowY: 'auto',
      }}
    >
      <div
        ref={containerRef}
        className={`modal ${className}`.trim()}
        style={{
          background: 'var(--panel)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          width: '100%',
          maxWidth,
          boxShadow: '0 24px 80px rgba(0, 0, 0, 0.67)',
          overflow: 'hidden',
        }}
      >
        {(title || subtitle || icon) && (
          <div
            className="modal-h"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '18px 24px',
              borderBottom: '1px solid var(--border-soft)',
            }}
          >
            {icon && <Icon name={icon} size={18} style={{ color: 'var(--accent)' }} />}
            <div>
              {title && (
                <h2
                  style={{
                    fontSize: '15px',
                    fontWeight: 700,
                    margin: 0,
                    color: 'var(--text)',
                  }}
                >
                  {title}
                </h2>
              )}
              {subtitle && (
                <div
                  className="sub"
                  style={{
                    fontSize: '12.5px',
                    color: 'var(--muted)',
                    marginTop: '2px',
                  }}
                >
                  {subtitle}
                </div>
              )}
            </div>
            {headerRight && <div style={{ marginLeft: 'auto', marginRight: '12px' }}>{headerRight}</div>}
            <button
              type="button"
              className="close"
              onClick={onClose}
              aria-label="Close modal"
              style={{
                marginLeft: headerRight ? '0' : 'auto',
                background: 'none',
                border: '1px solid var(--border)',
                borderRadius: '7px',
                color: 'var(--muted)',
                width: '30px',
                height: '30px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="close" size={14} />
            </button>
          </div>
        )}
        <div className="modal-b" style={{ padding: '20px 24px 24px' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
