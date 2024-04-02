import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import InputFormRow from '../../common/InputFormRow';
import FormSubmitButton from '../../common/FormSubmitButton';
import { HOME_FIELDS } from '../../common/fields';
import { validateField } from '../../common/validation';
import { checkObjForProfanity } from '../../common/profanity';
import usePostHome from './usePostHome';
import UploadImage from '../common/UploadImage';
import MapView from '../../common/MapView';
import { useMapEvents } from 'react-leaflet/hooks'


function MapClickHandlerComponent({ setLocation }) {
    const map = useMapEvents({
      click: (e) => {
        map.locate()
        console.log(e.latlng)
        setLocation((oldLocation) => ({
            ...oldLocation,
            latitude: e.latlng.lat,
            longitude: e.latlng.lng,
        }))
      },
    })
    return null
  }

export default function CreateHomeComponent() {
    const [homeInfo, setHomeInfo] = useState({});
    const [loading, setLoading] = useState(false);
    const [validationErrors, setValidationErrors] = useState(
        HOME_FIELDS.map((uf) => uf.name).reduce((acc, curr) => ((acc[curr] = ''), acc), {
            description: '',
        })
    );
    const [homePhotoData, setHomePhotoData] = useState(null);

    const postHomeAction = usePostHome();
    const navigate = useNavigate();

    const handleValidate = (e) => {
        const valError = validateField(e.target.type, e.target.value);
        if (valError) {
            setValidationErrors({
                ...validationErrors,
                [e.target.name]: valError,
            });
        } else {
            setValidationErrors((current) => {
                const copy = { ...current };
                delete copy[e.target.name];
                return copy;
            });
        }
    };

    const handleOnChange = (e) => {
        setHomeInfo({
            ...homeInfo,
            [e.target.name]: e.target.value,
        });
        handleValidate(e);
    };

    const handleOnSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        if (Object.keys(validationErrors).length > 0 || !homePhotoData) {
            import('react-toastify').then((module) =>
                module.toast.error('Please enter valid values!', {
                    autoClose: 3000,
                    pauseOnHover: false,
                })
            );
            setLoading(false);
            return;
        }
        if (checkObjForProfanity(homeInfo)) {
            import('react-toastify').then((module) =>
                module.toast.error('Please do not use bad words!', {
                    autoClose: 3000,
                    pauseOnHover: false,
                })
            );
            setLoading(false);
            return;
        }
        let addHomeData;
        try {
            const postHomeData = {
                ...homeInfo,
                photo_id: homePhotoData.id,
                latitude: homePhotoData.latitude,
                longitude: homePhotoData.longitude,
            }
            addHomeData = await postHomeAction(postHomeData);
            navigate(`/edit-home?homeId=${addHomeData.id}`);
        } catch (error) {
            import('react-toastify').then((module) =>
                module.toast.error('Server error', {
                    autoClose: 3000,
                    pauseOnHover: false,
                })
            );
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handlePhotoData = (photoData) => {
        console.log(photoData);
        setHomePhotoData(photoData);
    };

    const theComponentClick = <MapClickHandlerComponent setLocation={setHomePhotoData}/>

    return (
        <div className="create-home">
            <article>
                {homePhotoData ? (
                    <article style={{ margin: 'auto', width: '300px' }}>
                        <img src={homePhotoData.photo_url} alt="" width="100%" />
                    </article>
                ) : (
                    <UploadImage handlePhotoData={handlePhotoData} />
                )}
            </article>
            <form onSubmit={handleOnSubmit} data-testid="home-create-form">
                {HOME_FIELDS.map((hk) => (
                    <InputFormRow
                        key={hk.labelName}
                        labelName={hk.labelName}
                        name={hk.name}
                        value={homeInfo[hk.name]}
                        type={hk.type}
                        handleOnChange={handleOnChange}
                        validationError={validationErrors[hk.name]}
                        dataTestId={hk.name}
                    />
                ))}

                <article className="form-row">
                    <label>Description</label>
                    <textarea
                        type="text"
                        name="description"
                        data-testid="description"
                        value={homeInfo.description || ''}
                        onChange={handleOnChange}
                    />
                </article>

                <FormSubmitButton disabled={loading} />
            </form>
            {(homePhotoData && homePhotoData.latitude) && (
                <MapView latitude={homePhotoData.latitude} longitude={homePhotoData.longitude} MapClickerHandlerComponent={theComponentClick} />
            )}
        </div>
    );
}