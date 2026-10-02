
export interface TourResponse  {

  id: number,
  agencyId: number,
  details: {
    title: string,
    description: string,
    duration: string,
    difficulty: string,
    price: {
      amount: number,
      currency: string
    },
    status: string
  }

}
