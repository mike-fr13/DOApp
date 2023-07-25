import React, { useRef, useState } from 'react';
import { FormControl, FormLabel, Input, InputGroup, InputRightElement, Icon } from '@chakra-ui/react';
import { AiFillCopy } from 'react-icons/ai';

export const ReadOnlyInputWithCopy = ({ label, value }) => {
  const inputRef = useRef(null);
  const hiddenInputRef = useRef(null);
  const [isCopying, setIsCopying] = useState(false);

  const handleCopyClick = () => {
    // Copier le contenu du champ dans le presse-papiers
    if (hiddenInputRef.current) {
      hiddenInputRef.current.select();
      document.execCommand('copy');
      // Désélectionner le champ après la copie
      window.getSelection().removeAllRanges();
      // Activer l'effet d'enfoncement pendant un court instant
      setIsCopying(true);
      setTimeout(() => setIsCopying(false), 100);
    }
  };

  return (
    <FormControl>
      <FormLabel fontSize="sm" mb={0} mt={0}>
        {label}
      </FormLabel>
      <InputGroup>
        <Input
          variant='filled'
          type="text"
          value={value?.toString()}
          isReadOnly
          ref={inputRef} // Référence pour accéder à l'élément Input visible
        />
        <Input
          type="text"
          value={value?.toString()}
          ref={hiddenInputRef} // Référence pour accéder à l'élément Input invisible
          tabIndex="-1"
          style={{
            position: 'absolute',
            top: '-9999px',
            left: '-9999px',
          }}
          readOnly
        />
        <InputRightElement>
          <Icon
            as={AiFillCopy}
            color={isCopying ? 'gray.900 ' : 'gray.400'}
            cursor="pointer"
            onClick={handleCopyClick}
            transition="color 0.2s ease-in-out"
          />
        </InputRightElement>
      </InputGroup>
    </FormControl>
  );
};
