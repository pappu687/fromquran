import AppLogoIcon from './app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <AppLogoIcon className="size-9 fill-current text-black" />
            <div className="text-md ml-1 grid flex-1 text-left">
                <span className="mb-0.5 truncate leading-tight font-semibold">
                    From Quran
                </span>
            </div>
        </>
    );
}
