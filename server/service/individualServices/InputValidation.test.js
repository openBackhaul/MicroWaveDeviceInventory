const { validateControllerRegisterInput , validateControllerDeRegisterInput} = require('./InputValidation'); // Replace with actual module path

describe('validateControllerRegisterInput', () => {
  const validName = 'controller-1';
  const validRelease = 'v1.0';
  const validProtocol = 'HTTP';
  const validPort = 8080;

  test('returns true when all inputs are valid with ip-address', () => {
    const result = validateControllerRegisterInput(
      validName,
      validRelease,
      validProtocol,
      { 'ip-address': '192.168.1.1' },
      validPort
    );
    expect(result).toBe(true);
  });

  test('returns true when all inputs are valid with domain-name', () => {
    const result = validateControllerRegisterInput(
      validName,
      validRelease,
      validProtocol,
      { 'domain-name': 'example.com' },
      validPort
    );
    expect(result).toBe(true);
  });

  test('returns false when controllerName is missing', () => {
    const result = validateControllerRegisterInput(
      null,
      validRelease,
      validProtocol,
      { 'ip-address': '192.168.1.1' },
      validPort
    );
    expect(result).toBe(false);
  });

  test('returns false when controllerRelease is missing', () => {
    const result = validateControllerRegisterInput(
      validName,
      undefined,
      validProtocol,
      { 'ip-address': '192.168.1.1' },
      validPort
    );
    expect(result).toBe(false);
  });

  test('returns false when controllerProtocol is missing', () => {
    const result = validateControllerRegisterInput(
      validName,
      validRelease,
      null,
      { 'ip-address': '192.168.1.1' },
      validPort
    );
    expect(result).toBe(false);
  });

  test('returns false when controllerAddress is missing', () => {
    const result = validateControllerRegisterInput(
      validName,
      validRelease,
      validProtocol,
      {},
      validPort
    );
    expect(result).toBe(false);
  });

  test('returns false when controllerPort is missing', () => {
    const result = validateControllerRegisterInput(
      validName,
      validRelease,
      validProtocol,
      { 'ip-address': '192.168.1.1' },
      0
    );
    expect(result).toBe(false);
  });

  test('returns false when controllerAddress has invalid structure', () => {
    const result = validateControllerRegisterInput(
      validName,
      validRelease,
      validProtocol,
      { someOtherKey: 'value' },
      validPort
    );
    expect(result).toBe(false);
  });
});




describe('validateControllerDeRegisterInput', () => {
  const validName = 'controller-1';
  const validRelease = 'v1.0';

  test('returns true when both controllerName and controllerRelease are provided', () => {
    const result = validateControllerDeRegisterInput(validName, validRelease);
    expect(result).toBe(true);
  });

  test('returns false when controllerName is missing', () => {
    const result = validateControllerDeRegisterInput(null, validRelease);
    expect(result).toBe(false);
  });

  test('returns false when controllerRelease is missing', () => {
    const result = validateControllerDeRegisterInput(validName, undefined);
    expect(result).toBe(false);
  });

  test('returns false when both controllerName and controllerRelease are missing', () => {
    const result = validateControllerDeRegisterInput(null, null);
    expect(result).toBe(false);
  });

  test('returns false when controllerName is an empty string', () => {
    const result = validateControllerDeRegisterInput('', validRelease);
    expect(result).toBe(false);
  });

  test('returns false when controllerRelease is an empty string', () => {
    const result = validateControllerDeRegisterInput(validName, '');
    expect(result).toBe(false);
  });

  test('returns false when both controllerName and controllerRelease are empty strings', () => {
    const result = validateControllerDeRegisterInput('', '');
    expect(result).toBe(false);
  });
});
