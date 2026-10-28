// Mock mínimo y encadenable del cliente de Supabase para pruebas de servicios.
export type Call = { table: string; ops: [string, any[]][] };

export const createSupabaseMock = () => {
  const calls: Call[] = [];
  const results: Record<string, { data: any; error: any }[]> = {};
  const channels: { name: string; handler?: () => void; filter?: any; subscribed: boolean }[] = [];
  const removeChannel = jest.fn();

  // Encola la respuesta de la siguiente consulta a `table`.
  const queue = (table: string, data: any, error: any = null) => {
    (results[table] ??= []).push({ data, error });
  };

  const from = (table: string) => {
    const call: Call = { table, ops: [] };
    calls.push(call);
    const builder: any = new Proxy(
      {},
      {
        get: (_t, prop: string) => {
          if (prop === 'then') {
            const res = results[table]?.shift() ?? { data: null, error: null };
            return (resolve: any, reject: any) => Promise.resolve(res).then(resolve, reject);
          }
          return (...args: any[]) => {
            call.ops.push([prop, args]);
            return builder;
          };
        },
      }
    );
    return builder;
  };

  const channel = (name: string) => {
    const ch: any = { name, subscribed: false };
    channels.push(ch);
    ch.on = (_type: string, _filter: any, handler: () => void) => {
      ch.handler = handler;
      ch.filter = _filter;
      return ch;
    };
    ch.subscribe = () => {
      ch.subscribed = true;
      return ch;
    };
    return ch;
  };

  return { client: { from, channel, removeChannel }, calls, queue, channels, removeChannel };
};

// Instancia compartida para jest.mock('../supabase/client', ...)
export const sharedMock = createSupabaseMock();
