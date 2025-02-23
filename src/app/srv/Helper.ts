export async function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export function addAnimation(element: Element, className: string, after?: () => void) {
    element.classList.add('animate__animated', className);
    const fn = () => {
        element.removeEventListener('animationend', fn);
        element.classList.remove('animate__animated', className);
        if (after) {
            after();
        }
    };
    element.addEventListener('animationend', fn);
}

export const Animations = {
    'fade in': 'animate__fadeIn',
    'fade out': 'animate__fadeOut'
};