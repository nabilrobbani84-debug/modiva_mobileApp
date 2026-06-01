import re

with open(r'src\views\screens\LoginScreen.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the problematic section: footerText with literal \n escape sequences
# Pattern in file: footerText: {\n    color: '#9CA3AF',\n... (literal backslash-n)
idx = content.find('footerText: {\\n')
if idx == -1:
    print('Pattern not found in expected format')
    # Try to find where footerText is
    idx2 = content.find('footerText:')
    if idx2 != -1:
        print('Raw snippet:', repr(content[idx2:idx2+200]))
    exit(1)

# Find the end of the collapsed styles block (ends with \n});)
end = content.find('\\n});', idx)
if end == -1:
    print('Could not find end of collapsed block')
    exit(1)
end += len('\\n});')

old_block = content[idx:end]
print('Old block length:', len(old_block))
print('Old block (repr):', repr(old_block[:50]))

new_block = '''footerText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  labelOptional: {
    color: '#9CA3AF',
    fontWeight: '400',
    fontSize: 12,
    textTransform: 'none',
    letterSpacing: 0,
  }, 
  infoBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#2563EB',
    marginTop: 4,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E40AF',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 12,
    color: '#374151',
    marginBottom: 2,
    lineHeight: 18,
  },
  infoCode: {
    fontWeight: '700',
    color: '#2563EB',
  },
  infoNote: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
});'''

content = content[:idx] + new_block + content[end:]

with open(r'src\views\screens\LoginScreen.js', 'w', encoding='utf-8', newline='') as f:
    f.write(content)

print('SUCCESS: File fixed!') 
print('New total chars:', len(content))
