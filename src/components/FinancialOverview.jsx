import dayjs from "dayjs";

const TOTAL_ROOMS = 20; // TODO: set to your real room count

export default function FinancialOverview({ guests }) {
  const today = dayjs().startOf("day");

  const guestsCheckedInToday = guests.filter(
    (g) => g.checkInTime && dayjs(g.checkInTime).isSame(today, "day")
  );

  const guestsCheckedOutToday = guests.filter(
    (g) => g.checkOutTime && dayjs(g.checkOutTime).isSame(today, "day")
  );

  const totalRevenueToday = guestsCheckedOutToday.reduce(
    (sum, g) => sum + Number(g.paymentAmount || 0),
    0
  );

  const lateFeesCollected = guestsCheckedOutToday.reduce(
    (sum, g) => sum + Number(g.lateCheckoutFee || 0),
    0
  );

  const currentlyOccupied = guests.filter(
    (g) => g.checkInTime && !g.checkOutTime
  ).length;

  const occupancyRate =
    TOTAL_ROOMS > 0
      ? ((currentlyOccupied / TOTAL_ROOMS) * 100).toFixed(1)
      : "0.0";

  return (
    <div className="mb-4">
      <h5 className="mb-3 text-primary">Today&apos;s Financial Overview</h5>

      <div className="row g-3">
        <div className="col-12 col-sm-6 col-md-3">
          <div className="card text-center h-100">
            <div className="card-body">
              <div className="small text-muted">Total Revenue Today</div>
              <div className="fs-4 fw-bold">GH₵{totalRevenueToday}</div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-md-3">
          <div className="card text-center h-100">
            <div className="card-body">
              <div className="small text-muted">Guests Checked In Today</div>
              <div className="fs-4 fw-bold">{guestsCheckedInToday.length}</div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-md-3">
          <div className="card text-center h-100">
            <div className="card-body">
              <div className="small text-muted">Late Fees Collected</div>
              <div className="fs-4 fw-bold">GH₵{lateFeesCollected}</div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-md-3">
          <div className="card text-center h-100">
            <div className="card-body">
              <div className="small text-muted">Occupancy Rate</div>
              <div className="fs-4 fw-bold">{occupancyRate}%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
