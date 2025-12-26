import React from 'react';
import { useI18n } from '../utils/i18n';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  const { t } = useI18n();
  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200'>
      <div className='bg-slate-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-600'>
        <div className='p-6'>
          <div className='flex justify-between items-center mb-6'>
            <h2 className='text-2xl font-bold text-white'>{t('howToPlay')}</h2>
            <button
              onClick={onClose}
              className='text-slate-400 hover:text-white transition-colors'
            >
              <svg
                xmlns='http://www.w3.org/2000/svg'
                className='h-6 w-6'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M6 18L18 6M6 6l12 12'
                />
              </svg>
            </button>
          </div>

          <div className='space-y-4 text-slate-300'>
            <section>
              <h3 className='text-indigo-400 font-bold text-lg mb-2'>
                {t('objectiveTitle')}
              </h3>
              <p dangerouslySetInnerHTML={{ __html: t('objectiveDesc') }}></p>
            </section>

            <section>
              <h3 className='text-indigo-400 font-bold text-lg mb-2'>
                {t('movementTitle')}
              </h3>
              <ul className='list-disc pl-5 space-y-1'>
                <li
                  dangerouslySetInnerHTML={{ __html: t('movementDesc1') }}
                ></li>
                <li
                  dangerouslySetInnerHTML={{ __html: t('movementDesc2') }}
                ></li>
              </ul>
            </section>

            <section>
              <h3 className='text-red-400 font-bold text-lg mb-2'>
                {t('captureTitle')}
              </h3>
              <p className='mb-2'>{t('captureDesc')}</p>
              <div className='bg-slate-900 p-3 rounded-lg font-mono text-center text-sm border border-slate-700'>
                [YOU] - [YOU] - [ENEMY]
                <br />
                <span className='text-xs text-slate-500'>or</span>
                <br />
                [ENEMY] - [YOU] - [YOU]
              </div>
              <p className='mt-2 text-sm italic'>{t('captureNote')}</p>
            </section>

            <section>
              <h3 className='text-yellow-400 font-bold text-lg mb-2'>
                {t('specialRulesTitle')}
              </h3>
              <ul className='list-disc pl-5 space-y-4'>
                <li
                  dangerouslySetInnerHTML={{ __html: t('safeApproach') }}
                ></li>
                <li
                  dangerouslySetInnerHTML={{ __html: t('fullLineImmunity') }}
                ></li>
              </ul>
            </section>
          </div>

          <div className='mt-8'>
            <button
              onClick={onClose}
              className='w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors'
            >
              {t('gotIt')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RulesModal;
