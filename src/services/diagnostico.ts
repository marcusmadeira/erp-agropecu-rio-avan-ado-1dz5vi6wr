import pb from '@/lib/pocketbase/client'

export const getDiagnosticos = async () => {
  return pb.collection('diagnostico_inicial').getFullList({ sort: '-created' })
}

export const createDiagnostico = async (data: any) => {
  return pb.collection('diagnostico_inicial').create(data)
}
