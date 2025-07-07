import React, { useState, useEffect } from 'react';
import "./QR.scss";
import QRCode from 'qrcode';

export const QR = ({ label, data, isSmall }) => {
    const classname = "QR" + (isSmall ? " small" : "");
    const [qrDataUrl, setQrDataUrl] = useState('');

    useEffect(() => {
        if (data) {
            QRCode.toDataURL(data,{margin: 0, width:256, height:256},(error, url) => {
                if (error) console.error(error);
                else setQrDataUrl(url);
            });
        }
    }, [data]);

    console.log("qrDataUrl: "+qrDataUrl)

    return (
        <div className={classname}>
            <img src={qrDataUrl} alt="QR Code" />
            <span>{label}</span>
        </div>
    );
};