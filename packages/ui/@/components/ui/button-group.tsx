import { Children, type HTMLAttributes, ReactElement, cloneElement } from 'react';

import { ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ButtonGroupProps {
  className?: string;
  orientation?: 'horizontal' | 'vertical';
  children: ReactElement<ButtonProps>[];
}

interface ButtonGroupTextProps extends HTMLAttributes<HTMLSpanElement> {}

export const ButtonGroup = ({
  className,
  orientation = 'horizontal',
  children,
}: ButtonGroupProps) => {
  const totalButtons = Children.count(children);
  const isHorizontal = orientation === 'horizontal';
  const isVertical = orientation === 'vertical';

  return (
    <div
      className={cn(
        'flex',
        {
          'flex-col': isVertical,
          'w-fit': isVertical,
        },
        className
      )}
    >
      {Children.map(children, (child, index) => {
        const isFirst = index === 0;
        const isLast = index === totalButtons - 1;

        return cloneElement(child, {
          className: cn(
            {
              'rounded-l-none': isHorizontal && !isFirst,
              'rounded-r-none': isHorizontal && !isLast,
              'border-l-0': isHorizontal && !isFirst,

              'rounded-t-none': isVertical && !isFirst,
              'rounded-b-none': isVertical && !isLast,
              'border-t-0': isVertical && !isFirst,
            },
            child.props.className
          ),
        });
      })}
    </div>
  );
};

export const ButtonGroupText = ({ className, ...props }: ButtonGroupTextProps) => (
  <span
    className={cn(
      'inline-flex h-8 items-center rounded-md border border-input bg-background px-2 text-xs font-medium',
      className
    )}
    {...props}
  />
);
