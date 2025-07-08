import { useTranslation } from 'react-i18next';

export const ViewError = ({code, text}) => {
    const { t } = useTranslation();

    return (
        <div className="ViewError">
            <h1>{t('error.oops')}</h1>
            <h1>{code}</h1>
            {text || t('error.defaultMessage')}
        </div>
    )
}
export const ViewLoading = ({text})=>{

    return <div className="ViewLoading">
        <div className="vstack">
            <img style={{}} width={24} height={24} src="https://th.bing.com/th/id/OIP.pGPfH0aY_FnHNhzInv6ZXAHaHY?rs=1&pid=ImgDetMain" alt={t('loading.altText')} />
            {text || t('loading.defaultText')}
        </div>
    </div>
}