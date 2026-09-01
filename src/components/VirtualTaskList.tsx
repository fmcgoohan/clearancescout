import React, { useState, useRef } from 'react';

interface VirtualTaskListProps<T> {
  items: T[];
  itemHeight?: number;
  containerHeight?: number;
  renderItem: (item: T, index: number) => React.ReactNode;
}

export function VirtualTaskList<T extends { id: string }>({
  items,
  itemHeight = 80,
  containerHeight = 400,
  renderItem,
}: VirtualTaskListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalHeight = items.length * itemHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - 2);
  const endIndex = Math.min(items.length - 1, Math.ceil((scrollTop + containerHeight) / itemHeight) + 2);

  const visibleItems = items.slice(startIndex, endIndex + 1);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{ height: containerHeight, overflowY: 'auto' }}
      className="relative border rounded-lg bg-white dark:bg-gray-900"
      data-testid="virtual-task-list"
    >
      <div style={{ height: totalHeight, width: '100%', position: 'relative' }}>
        {visibleItems.map((item, idx) => {
          const actualIndex = startIndex + idx;
          return (
            <div
              key={item.id}
              style={{
                position: 'absolute',
                top: actualIndex * itemHeight,
                left: 0,
                right: 0,
                height: itemHeight,
              }}
            >
              {renderItem(item, actualIndex)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
