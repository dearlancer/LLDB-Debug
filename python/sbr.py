import lldb
import re

offsetAddress = 0

def getASLR(module):
    interpreter = lldb.debugger.GetCommandInterpreter()
    returnObject = lldb.SBCommandReturnObject()
    interpreter.HandleCommand('image list | grep ' + module, returnObject)
    output = returnObject.GetOutput()
    m = re.compile(r'0x[0-9a-f]*')
    r = m.findall(str(output))

    if len(r) > 0 :
        return int(r[0], 16)
    else:
        return 0

def sbr(debugger, command, result, internal_dict):
    if not command:
        print >> result, 'Please input the address and module!'
        return

    list = command.split(' ')
    module = ''
    offset = 0

    addr = list[0]
    if addr[:2] != '0x' and addr[:2] != '0X':
        addr = '0x' + addr

    if len(list) > 1 :
        module = list[1]
        offset = getASLR(module)

    cmd = 'br set -a "0x%s+%s"' % (format(offset, 'x'), addr)
    print(cmd)
    debugger.HandleCommand(cmd)

def sread(debugger, command, result, internal_dict):
    if not command:
        print >> result, 'Please input the address!'
        return

    list = command.split(' ')
    str = '0x'
    for i in range(len(list)):
        str = '%s%s' % (str, list[len(list)-i-1])

    cmd = 'memory read %s' % (str)
    print(cmd)
    debugger.HandleCommand(cmd)

def saddr(debugger, command, result, internal_dict):
    if not command:
        print >> result, 'Please input the address and module!'
        return

    list = command.split(' ')
    module = ''
    offset = 0

    addr = list[0]
    if addr[:2] != '0x' and addr[:2] != '0X':
        addr = '0x' + addr

    if len(list) > 1 :
        module = list[1]
        offset = getASLR(module)

    naddr = int(addr, 16) - offset

    result = 'trans %s to 0x%s in %s"' % (addr, format(naddr, 'x'), module)
    print(result)

def __lldb_init_module(debugger, internal_dict):
    debugger.HandleCommand('command script add sbr -f sbr.sbr')
    debugger.HandleCommand('command script add sread -f sbr.sread')
    debugger.HandleCommand('command script add saddr -f sbr.saddr')
